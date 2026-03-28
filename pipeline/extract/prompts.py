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
You are a senior business analyst extracting business rules from \
enterprise documentation for a compliance knowledge base.

Workflow context: {workflow_name}
Department: {department}

Analyze this text carefully and extract every business rule, \
constraint, decision point, validation requirement, approval \
threshold, exception condition, or process obligation.

For each rule found, produce a detailed JSON object.
Return ONLY a raw JSON array. No explanation, no markdown, \
no backticks.

JSON format per rule:
{{
  "summary": "A precise, specific one-sentence description that \
includes the key constraint, threshold, or requirement. \
Must be specific enough that someone can understand the rule \
without reading the detail. Include numbers, roles, systems, \
or timeframes if present in the source. \
Bad example: 'Invoices require approval' \
Good example: 'Vendor invoices exceeding $10,000 require \
written approval from the VP of Finance before payment \
can be processed'",

  "detail": "A comprehensive explanation of this rule including: \
- The exact condition or trigger that activates this rule \
- All thresholds, limits, or specific values mentioned \
- The roles or departments responsible for compliance \
- The system or process where this rule is enforced \
- Any exceptions or special cases explicitly mentioned \
- The consequence or action if the rule is violated \
- Any referenced forms, reports, or documents \
Write in complete sentences. Minimum 3 sentences. \
Quote specific values and thresholds exactly as stated \
in the source document.",

  "rule_type": "one of: validation | decision | calculation | \
workflow | security | integration | other",

  "confidence": "high if the rule is explicitly stated with \
clear language | medium if implied or requires interpretation | \
low if inferred from context"
}}

Extract EVERY rule you can find. Do not merge multiple rules \
into one. If a paragraph contains three separate constraints, \
extract three separate rules.

If no business rules exist in this text, return: []

Text to analyze:
{chunk}
"""
