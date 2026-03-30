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
You are converting a business document into clean markdown.

RULES:
- Start immediately with the content. No preamble.
- Use ## for section headings
- Keep numbered steps as numbered lists
- Remove these exact strings wherever they appear:
  "Business Applications"
  "Source: IS Department API Group, Inc."
  "Continue of"
  "Page 1 of", "Page 2 of", "Page 3 of" (any page number)
- Where you see "Figure 1", "Figure 2" etc, write exactly:
  [FIGURE_1], [FIGURE_2] etc on their own line
- Do not write the word "Instructions" or "Title" or "Rules"
- Do not explain what you are doing
- Output only the cleaned document content

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
