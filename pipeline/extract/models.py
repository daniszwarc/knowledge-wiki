from typing import Literal
from pydantic import BaseModel, field_validator

VALID_RULE_TYPES = {"validation", "decision", "calculation", "workflow", "security", "integration", "other"}
VALID_CONFIDENCE = {"high", "medium", "low"}


class ExtractedRule(BaseModel):
    summary: str
    detail: str
    rule_type: Literal["validation", "decision", "calculation", "workflow", "security", "integration", "other"]
    confidence: Literal["high", "medium", "low"]

    @field_validator("rule_type", mode="before")
    @classmethod
    def coerce_rule_type(cls, v: object) -> str:
        if isinstance(v, str) and v.lower() in VALID_RULE_TYPES:
            return v.lower()
        return "other"

    @field_validator("confidence", mode="before")
    @classmethod
    def coerce_confidence(cls, v: object) -> str:
        if isinstance(v, str) and v.lower() in VALID_CONFIDENCE:
            return v.lower()
        return "low"
