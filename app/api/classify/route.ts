import { NextRequest, NextResponse } from "next/server";

const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-1.13.0";

interface JevChoiceAnswer {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

interface JevNoulAnswer {
  type: "noul";
  noul: number;
}

interface JevResponse {
  answers: {
    doc_type: JevChoiceAnswer;
    needs_review: JevNoulAnswer;
  };
}

export async function POST(req: NextRequest) {
  const redactedHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    redactedHeaders[key] = key.toLowerCase() === "cookie" ? `[present, ${value.length} chars]` : value;
  });
  console.log("[classify] incoming request", {
    method: req.method,
    url: req.url,
    headers: redactedHeaders,
  });

  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TYPESAFE_API_KEY is not configured" }, { status: 500 });
  }

  const { text, filename } = (await req.json()) as { text?: string; filename?: string };
  if (!text || !filename) {
    return NextResponse.json({ error: "text and filename are required" }, { status: 400 });
  }

  const state = `Filename: ${filename}\n\nDocument content:\n${text}`;

  const body = {
    model: JEV_MODEL,
    state,
    questions: {
      doc_type: {
        type: "choice",
        instructions: "What type of document is this?",
        criteria: {
          process: "How-to guide or training material with step-by-step instructions",
          article: "Reference article, policy document, or knowledge base entry",
          sed: "Small Enhancement Document — structured APi Group change request with ticket numbers, requestor, and programmer fields",
          video: "SharePoint video transcript in VTT format",
        },
      },
      needs_review: {
        type: "noul",
        instructions: "Confidence is low and a human should verify the classification before processing",
      },
    },
  };

  let jevRes: Response;
  try {
    jevRes = await fetch(JEV_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "Jev request failed" }, { status: 502 });
  }

  if (!jevRes.ok) {
    const detail = await jevRes.text().catch(() => jevRes.statusText);
    return NextResponse.json({ error: `Jev API error: ${detail}` }, { status: 502 });
  }

  const json = (await jevRes.json()) as JevResponse;
  const docType = json.answers?.doc_type;
  const needsReview = json.answers?.needs_review;

  if (!docType || typeof docType.choice !== "string" || typeof docType.confidence !== "number" || !needsReview || typeof needsReview.noul !== "number") {
    return NextResponse.json({ error: "Unexpected Jev response shape" }, { status: 502 });
  }

  return NextResponse.json({
    doc_type: docType.choice,
    confidence: docType.confidence,
    needs_review: needsReview.noul,
  });
}
