from typing import Literal, Optional
from pydantic import BaseModel, field_validator

VALID_RULE_TYPES = {"validation", "decision", "calculation", "workflow", "security", "integration", "other"}


class ExtractedRule(BaseModel):
    summary: str
    detail: str
    rule_type: Optional[Literal["validation", "decision", "calculation", "workflow", "security", "integration", "other"]] = "other"

    @field_validator("rule_type", mode="before")
    @classmethod
    def coerce_rule_type(cls, v: object) -> str:
        if isinstance(v, str) and v.lower() in VALID_RULE_TYPES:
            return v.lower()
        return "other"
