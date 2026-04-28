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

SED_EXTRACTION_PROMPT = """Read the SED document below and extract specific values. Return ONLY a JSON object. No explanation. No markdown. No backticks.

Rules:
- project_title: this is the FIRST line or heading of the document — the actual enhancement name (e.g. "Add New 1099 Value"). NOT a ticket label.
- ticket_number: look for INC, CHG, Story, TD/OMS Task numbers — prefer the Story or INC number
- department: look for Company or Department field value
- author: look for Requestor field value (not Programmer)
- date: look for any date field, format as YYYY-MM-DD or null
- affected_systems: look for system or application names mentioned
- business_requirements: copy ONLY the text written by the user AFTER the instructions paragraph that starts with "This section is to be filled out by...". Skip any instructional boilerplate. Copy only the actual requirement content written for this specific request.
- it_design: copy ONLY the actual design content written for this request, skip any instructional boilerplate
- unit_testing: copy ONLY the actual test cases written for this request, skip any instructional boilerplate
- acceptance_testing: copy ONLY the actual acceptance criteria written for this request, skip any instructional boilerplate

If a section contains only boilerplate instructions and no actual content, return null for that field.

JSON keys:
{{
  "ticket_number": "...",
  "project_title": "...",
  "department": "...",
  "author": "...",
  "date": "...",
  "affected_systems": "...",
  "business_requirements": "...",
  "it_design": "...",
  "unit_testing": "...",
  "acceptance_testing": "..."
}}

DOCUMENT:
{text}
"""

EXTRACTION_PROMPT = """<instructions>
You are a business rules extractor. Read the document below and extract ONLY rules that appear explicitly in the document text.

A business rule is one of:
- A dollar threshold requiring approval
- A deadline or time limit
- An access control or permission requirement
- A validation rule or data requirement
- A compliance obligation

DO NOT extract anything from these instructions.
DO NOT invent rules not stated in the document.
If the document contains no business rules, return exactly: []

Return ONLY a JSON array. No explanation. No markdown. No backticks.

Each rule object:
{{"summary": "one sentence stating the rule exactly as the document states it", "detail": "full context including conditions, roles, thresholds, exceptions. Minimum 2 sentences.", "rule_type": "validation|decision|calculation|workflow|security|integration|other"}}
</instructions>

<document>
Workflow: {workflow_name}
Department: {department}

{chunk}
</document>"""
