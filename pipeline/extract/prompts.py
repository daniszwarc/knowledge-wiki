ARTICLE_CONVERSION_PROMPT = """
Convert the following raw document text into clean, well-structured \
markdown suitable for a technical knowledge base.

Rules:
- Use ## for major sections, ### for subsections
- Preserve all technical details, examples, code snippets, and \
specific values exactly as written
- Remove redundant bullet points — convert to prose where appropriate
- Do not summarize or omit any content
- Do not add commentary or introductions
- Output only the markdown content, nothing else

Document title: {title}

Raw text:
{text}
"""

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
