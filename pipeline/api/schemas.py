from typing import Optional
from pydantic import BaseModel
from extract.models import ExtractedRule


class IngestTextRequest(BaseModel):
    text: str
    workflow_name: str
    department: str
    article_type: str = "how_to_guide"
    owner_name: str = ""
    owner_email: str = ""
    source: str = ""


class IngestResponse(BaseModel):
    job_id: str
    filename: str
    format: str
    chunks_processed: int
    rules_extracted: int
    rules_written: int
    errors: list[str]
    rules: list[ExtractedRule]
    source_url: Optional[str] = None
    document_type: str = "rules"
    article_id: Optional[str] = None
    article_title: Optional[str] = None
    workflow_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    ollama: bool
    database: bool


class WorkflowItem(BaseModel):
    id: str
    name: str
    department: str
