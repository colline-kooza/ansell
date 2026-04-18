import { NextRequest, NextResponse } from "next/server";

type ReviewResult = {
  approved: boolean;
  reason: string;
  source: "gemini" | "fallback";
};

const INVALID_COMPANY_NAME_PATTERN =
  /^(test|testing|demo|sample|fake|invalid|none|na|n\/a|null|undefined|company|my company|abc|asdf|qwerty)$/i;

const DISPOSABLE_EMAIL_PATTERN =
  /(mailinator|guerrillamail|10minutemail|tempmail|yopmail|sharklasers)/i;

function cleanSecret(value?: string | null) {
  return value?.trim().replace(/^["']|["']$/g, "") || "";
}

function isValidEmail(value?: string) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !DISPOSABLE_EMAIL_PATTERN.test(value);
}

function isValidWebsite(value?: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidPhone(value?: string) {
  if (!value) return false;
  return value.replace(/[^\d]/g, "").length >= 7;
}

function hasMeaningfulDescription(value?: string) {
  if (!value) return false;
  const normalized = value.trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  return normalized.length >= 20 && words.length >= 4;
}

function fallbackReview(body: Record<string, unknown>): ReviewResult {
  const companyName = String(body.company_name ?? "").trim();
  const industry = String(body.industry ?? "").trim();
  const description = String(body.description ?? "").trim();
  const city = String(body.city ?? "").trim();
  const address = String(body.address ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  const website = String(body.website ?? "").trim();
  const documentUrls = Array.isArray(body.document_urls)
    ? body.document_urls.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];

  if (companyName.length < 3) {
    return { approved: false, reason: "Company name must be at least 3 characters long.", source: "fallback" };
  }

  if (INVALID_COMPANY_NAME_PATTERN.test(companyName)) {
    return {
      approved: false,
      reason: "Please use the real company name instead of a placeholder or test value.",
      source: "fallback",
    };
  }

  if (!industry) {
    return { approved: false, reason: "Industry is required.", source: "fallback" };
  }

  if (!city || !address) {
    return { approved: false, reason: "City and physical address are required.", source: "fallback" };
  }

  if (!isValidPhone(phone)) {
    return { approved: false, reason: "A valid phone number is required.", source: "fallback" };
  }

  if (!isValidEmail(email)) {
    return { approved: false, reason: "A valid non-disposable company email is required.", source: "fallback" };
  }

  if (!isValidWebsite(website)) {
    return { approved: false, reason: "Website must be a valid http or https URL.", source: "fallback" };
  }

  if (!hasMeaningfulDescription(description)) {
    return {
      approved: false,
      reason: "Company description must be meaningful and descriptive before submission.",
      source: "fallback",
    };
  }

  if (documentUrls.length === 0) {
    return { approved: false, reason: "At least one supporting document is required.", source: "fallback" };
  }

  return {
    approved: true,
    reason: "Application passed automated validation checks.",
    source: "fallback",
  };
}

function buildPrompt(body: Record<string, unknown>) {
  return `You are a company registration reviewer for Anasell, a digital marketplace platform in South Sudan.

Review the following company application and determine if it should be approved for initial processing.

Company Details:
- Name: ${String(body.company_name ?? "N/A")}
- Industry: ${String(body.industry ?? "N/A")}
- Description: ${String(body.description ?? "N/A")}
- City: ${String(body.city ?? "N/A")}
- Address: ${String(body.address ?? "N/A")}
- Phone: ${String(body.phone ?? "N/A")}
- Email: ${String(body.email ?? "N/A")}
- Website: ${String(body.website ?? "N/A")}
- Employee Count: ${String(body.size ?? "N/A")}
- Documents Submitted: ${Array.isArray(body.document_urls) ? body.document_urls.length : 0} document(s)

Rules for approval:
1. Company name must be present and not clearly fake or offensive
2. Industry must be specified
3. City and address must be provided
4. Phone must be present and realistic
5. At least one document must be submitted
6. Description should be meaningful
7. Email should look real and not disposable

Respond ONLY with a JSON object in this exact format:
{"approved": true, "reason": "Brief positive reason"}
or
{"approved": false, "reason": "Brief explanation of what is missing or problematic"}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;
  const localReview = fallbackReview(body);
  const apiKey = cleanSecret(
    process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
  );

  if (!apiKey) {
    return NextResponse.json(localReview);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(body) }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(localReview);
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(localReview);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      approved: Boolean(parsed.approved),
      reason: String(parsed.reason ?? localReview.reason),
      source: "gemini",
    } satisfies ReviewResult);
  } catch {
    return NextResponse.json(localReview);
  }
}
