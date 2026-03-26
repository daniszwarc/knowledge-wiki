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


def create_workflow_if_missing(name: str, department: str) -> str:
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
                    id, workflow_id, summary, detail, rule_type, confidence,
                    stakeholder_validated, owner_name, owner_email, source, source_url, extracted_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    new_id,
                    workflow_id,
                    rule.summary,
                    rule.detail,
                    rule.rule_type,
                    rule.confidence,
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
                            "confidence": rule.confidence,
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


def list_workflows() -> list[dict]:
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, name, department FROM workflows ORDER BY name")
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()
