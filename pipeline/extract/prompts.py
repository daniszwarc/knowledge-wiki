CLASSIFICATION_PROMPT = """Classify this document. Reply with exactly one word: RULES or ARTICLE.

Reply RULES only if the document contains explicit business constraints such as:
- Dollar thresholds requiring approval
- Access control rules
- Compliance requirements with deadlines or conditions
- Validation rules

Reply ARTICLE for everything else: guides, how-to documents, training material, \
system documentation, reports, screen navigation, architecture docs.

When in doubt, reply ARTICLE.

Document excerpt:
{text}"""

ARTICLE_CONVERSION_PROMPT = """
You are converting a business document into a clean HTML article.

RULES:
- Output only HTML. No markdown. No backticks. No preamble.
- Use <h2> for section headings
- Use <p> for body text and paragraphs
- Use <ol> and <li> for numbered steps
- Use <ul> and <li> for bullet points
- Use <strong> for emphasis
- Remove these strings wherever they appear:
  "Business Applications"
  "Source: IS Department API Group, Inc."
  "Continue of"
  "Page 1 of", "Page 2 of", "Page 3 of" (any page number variation)
- The text may contain [FIGURE_1], [FIGURE_2] etc. placeholders. Preserve them exactly as they appear, each on its own line
- Do not output <html>, <head>, <body>, or any wrapper tags
- Do not explain what you are doing
- Output only the article content

DOCUMENT:
{text}
"""

EXTRACTION_PROMPT = """
You are extracting business rules from enterprise documentation.

Workflow: {workflow_name}
Department: {department}

Extract every business rule, constraint, approval requirement,
validation rule, or process obligation from the text below.

Return ONLY a JSON array. No explanation, no markdown, no backticks.

Each rule:
{{
  "summary": "one specific sentence stating the rule",
  "detail": "full explanation including thresholds, conditions, roles, systems, and exceptions. Minimum 3 sentences.",
  "rule_type": "validation|decision|calculation|workflow|security|integration|other"
}}

If no rules found: []

Text:
{chunk}
"""
