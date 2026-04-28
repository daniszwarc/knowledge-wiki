import json
import os
import uuid
from typing import Optional
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
WIKI_API_URL = os.getenv("WIKI_API_URL", "http://localhost:3000")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def find_workflow_id(workflow_name: str) -> Optional[str]:
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id FROM workflows WHERE LOWER(name) LIKE LOWER(%s) LIMIT 1",
                (f"%{workflow_name}%",),
            )
            row = cur.fetchone()
            return str(row["id"]) if row else None
    finally:
        conn.close()


def create_workflow_if_missing(name: str, department: str, created_by: str = "pipeline") -> str:
    existing = find_workflow_id(name)
    if existing:
        return existing

    new_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO workflows (id, name, department, description, completeness_score)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (new_id, name, department, "", 0.0),
            )
            cur.execute(
                """
                INSERT INTO audit_log (table_name, record_id, action, changed_by, changed_at, new_value)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                """,
                (
                    "workflows",
                    new_id,
                    "INSERT",
                    created_by,
                    psycopg2.extras.Json({"name": name, "department": department}),
                ),
            )
            conn.commit()
        return new_id
    finally:
        conn.close()


def insert_rule(
    rule,
    workflow_id: str,
    owner_name: str,
    owner_email: str,
    source: str,
    source_url: Optional[str] = None,
) -> str:
    new_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO rules (
                    id, workflow_id, summary, detail, rule_type,
                    stakeholder_validated, owner_name, owner_email, source, source_url, extracted_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    new_id,
                    workflow_id,
                    rule.summary,
                    rule.detail,
                    rule.rule_type,
                    False,
                    owner_name,
                    owner_email,
                    source,
                    source_url,
                ),
            )
            cur.execute(
                """
                INSERT INTO audit_log (table_name, record_id, action, changed_by, changed_at, new_value)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                """,
                (
                    "rules",
                    new_id,
                    "INSERT",
                    owner_email or "pipeline",
                    psycopg2.extras.Json(
                        {
                            "summary": rule.summary,
                            "rule_type": rule.rule_type,
                        }
                    ),
                ),
            )
            conn.commit()
        return new_id
    finally:
        conn.close()


def call_embed(rule_id: str, text: str) -> bool:
    try:
        response = httpx.post(
            f"{WIKI_API_URL}/api/embed",
            json={"ruleId": rule_id, "text": text},
            timeout=30.0,
        )
        return response.status_code == 200
    except Exception:
        return False


def insert_article(
    title: str,
    department: str,
    workflow_name: str,
    content: str,
    source_filename: str,
    source_url: Optional[str],
    created_by: str,
    article_type: str = "how_to_guide",
) -> str:
    new_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO articles (
                    id, title, department, workflow_name, content,
                    source_filename, source_url, created_by, article_type
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (new_id, title, department, workflow_name or None,
                 content, source_filename, source_url, created_by, article_type),
            )
            cur.execute(
                """
                INSERT INTO audit_log (table_name, record_id, action, changed_by, changed_at, new_value)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                """,
                (
                    "articles",
                    new_id,
                    "INSERT",
                    created_by,
                    psycopg2.extras.Json({"title": title, "source_filename": source_filename}),
                ),
            )
            conn.commit()
        return new_id
    finally:
        conn.close()


def call_article_embed(article_id: str, text: str) -> bool:
    try:
        response = httpx.post(
            f"{WIKI_API_URL}/api/articles/embed",
            json={"articleId": article_id, "text": text},
            timeout=60.0,
        )
        return response.status_code == 200
    except Exception:
        return False


def upsert_sed(data: dict, created_by: str) -> str:
    """Insert or update SED by story_number (or ticket_number fallback). Returns sed id."""
    conn = get_connection()
    try:
        data_copy = dict(data)
        data_copy["business_requirements_images"] = json.dumps(data.get("business_requirements_images") or [])
        data_copy["it_design_images"] = json.dumps(data.get("it_design_images") or [])
        data_copy["unit_testing_images"] = json.dumps(data.get("unit_testing_images") or [])
        data_copy["acceptance_testing_images"] = json.dumps(data.get("acceptance_testing_images") or [])
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            conflict_target = "story_number" if data.get("story_number") else "ticket_number"
            cur.execute(
                f"""
                INSERT INTO seds (
                    ticket_number, project_title, department, author, date,
                    affected_systems, business_requirements, it_design,
                    unit_testing, acceptance_testing, raw_content,
                    source_filename, created_by,
                    inc_ticket, cab_ticket, story_number, td_oms_task,
                    requestor, programmer, contributors, approved_by, company,
                    business_requirements_images, it_design_images,
                    unit_testing_images, acceptance_testing_images
                ) VALUES (
                    %(ticket_number)s, %(project_title)s, %(department)s, %(author)s, %(date)s,
                    %(affected_systems)s, %(business_requirements)s, %(it_design)s,
                    %(unit_testing)s, %(acceptance_testing)s, %(raw_content)s,
                    %(source_filename)s, %(created_by)s,
                    %(inc_ticket)s, %(cab_ticket)s, %(story_number)s, %(td_oms_task)s,
                    %(requestor)s, %(programmer)s, %(contributors)s, %(approved_by)s, %(company)s,
                    %(business_requirements_images)s::jsonb, %(it_design_images)s::jsonb,
                    %(unit_testing_images)s::jsonb, %(acceptance_testing_images)s::jsonb
                )
                ON CONFLICT ({conflict_target}) DO UPDATE SET
                    ticket_number                 = EXCLUDED.ticket_number,
                    project_title                 = EXCLUDED.project_title,
                    department                    = EXCLUDED.department,
                    author                        = EXCLUDED.author,
                    date                          = EXCLUDED.date,
                    affected_systems              = EXCLUDED.affected_systems,
                    business_requirements         = EXCLUDED.business_requirements,
                    it_design                     = EXCLUDED.it_design,
                    unit_testing                  = EXCLUDED.unit_testing,
                    acceptance_testing            = EXCLUDED.acceptance_testing,
                    raw_content                   = EXCLUDED.raw_content,
                    source_filename               = EXCLUDED.source_filename,
                    inc_ticket                    = EXCLUDED.inc_ticket,
                    cab_ticket                    = EXCLUDED.cab_ticket,
                    story_number                  = EXCLUDED.story_number,
                    td_oms_task                   = EXCLUDED.td_oms_task,
                    requestor                     = EXCLUDED.requestor,
                    programmer                    = EXCLUDED.programmer,
                    contributors                  = EXCLUDED.contributors,
                    approved_by                   = EXCLUDED.approved_by,
                    company                       = EXCLUDED.company,
                    business_requirements_images  = EXCLUDED.business_requirements_images,
                    it_design_images              = EXCLUDED.it_design_images,
                    unit_testing_images           = EXCLUDED.unit_testing_images,
                    acceptance_testing_images     = EXCLUDED.acceptance_testing_images,
                    updated_at                    = NOW()
                RETURNING id
                """,
                {**data_copy, "created_by": created_by},
            )
            row = cur.fetchone()
            conn.commit()
            return str(row["id"])
    finally:
        conn.close()


def call_sed_embed(sed_id: str, text: str) -> None:
    """Call the wiki embed endpoint for a SED."""
    try:
        httpx.post(
            f"{WIKI_API_URL}/api/seds/{sed_id}/embed",
            json={"sedId": sed_id, "text": text},
            timeout=60.0,
        )
    except Exception:
        pass


def list_workflows() -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, name, department FROM workflows ORDER BY name")
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()
