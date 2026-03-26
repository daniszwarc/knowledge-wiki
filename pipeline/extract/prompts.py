EXTRACTION_PROMPT = """
You are extracting business rules from enterprise documentation.

Workflow context: {workflow_name}
Department: {department}

Analyze this text and extract every business rule, decision threshold,
validation requirement, approval step, exception condition, or process
constraint you can identify.

For each rule found, output a JSON object. Return ONLY a raw JSON array.
No explanation, no markdown, no backticks.

Format per rule:
{{
  "summary": "one sentence, plain English, non-technical",
  "detail": "full explanation with any thresholds, conditions, or values",
  "rule_type": "validation|decision|calculation|workflow|security|integration|other",
  "confidence": "high|medium|low"
}}

If no business rules are found in this text, return: []

Text to analyze:
{chunk}
"""
