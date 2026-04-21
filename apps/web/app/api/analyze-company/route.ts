import { NextRequest, NextResponse } from "next/server";

type ReviewResult = {
  approved: boolean;
  reason: string;
  source: "gemini" | "fallback";
};

// mime types Gemini 1.5 Pro accepts as inline_data
const SUPPORTED_MIME = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/heic", "image/heif", "application/pdf",
]);

const MAX_INLINE_BYTES = 18 * 1024 * 1024; // 18 MB safety limit (Gemini inline cap is 20 MB)

const INVALID_COMPANY_NAME_PATTERN =
  /^(test|testing|demo|sample|fake|invalid|none|na|n\/a|null|undefined|company|my company|abc|asdf|qwerty|xyz|aaa|bbb|ccc)$/i;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","10minutemail.com","tempmail.com","yopmail.com",
  "sharklasers.com","guerrillamailblock.com","throwam.com","maildrop.cc","trashmail.com",
  "fakeinbox.com","dispostable.com","spamgourmet.com","mytemp.email","temp-mail.org",
  "example.com","test.com","sample.com","fake.com","invalid.com","nobody.com",
  "mailnull.com","spamex.com","crazespaces.pw","getairmail.com","mailnesia.com",
]);

function cleanSecret(v?: string | null) {
  return v?.trim().replace(/^["']|["']$/g, "") || "";
}

function isValidEmail(value?: string) {
  if (!value) return false;
  const domain = value.split("@")[1]?.toLowerCase();
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidWebsite(value?: string) {
  if (!value) return true;
  try { const u = new URL(value); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}

function isValidPhone(value?: string) {
  if (!value) return false;
  return value.replace(/[^\d]/g, "").length >= 7;
}

function hasMeaningfulDescription(value?: string) {
  if (!value) return false;
  const s = value.trim();
  if (/^(n\/a|none|na|test|sample|description|about us|our company)$/i.test(s)) return false;
  return s.length >= 25 && s.split(/\s+/).filter(Boolean).length >= 5;
}

async function checkEmailDomainMX(email: string): Promise<boolean> {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return true;
    const data = await res.json() as { Answer?: unknown[] };
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch { return true; }
}

async function fallbackReview(body: Record<string, unknown>): Promise<ReviewResult> {
  const companyName = String(body.company_name ?? "").trim();
  const industry    = String(body.industry ?? "").trim();
  const description = String(body.description ?? "").trim();
  const city        = String(body.city ?? "").trim();
  const address     = String(body.address ?? "").trim();
  const phone       = String(body.phone ?? "").trim();
  const email       = String(body.email ?? "").trim();
  const website     = String(body.website ?? "").trim();
  const documentUrls = Array.isArray(body.document_urls)
    ? body.document_urls.map((x) => String(x ?? "").trim()).filter(Boolean) : [];

  if (companyName.length < 3) return { approved: false, reason: "Company name must be at least 3 characters.", source: "fallback" };
  if (INVALID_COMPANY_NAME_PATTERN.test(companyName)) return { approved: false, reason: "Please use the real company name instead of a placeholder.", source: "fallback" };
  if (!industry) return { approved: false, reason: "Industry is required.", source: "fallback" };
  if (!city || !address) return { approved: false, reason: "City and physical address are required.", source: "fallback" };
  if (!isValidPhone(phone)) return { approved: false, reason: "A valid phone number (at least 7 digits) is required.", source: "fallback" };
  if (!isValidEmail(email)) return { approved: false, reason: "A valid, non-disposable company email is required.", source: "fallback" };

  const mxOk = await checkEmailDomainMX(email);
  if (!mxOk) return { approved: false, reason: `The email domain "${email.split("@")[1]}" does not appear to be a real mail domain.`, source: "fallback" };

  if (!isValidWebsite(website)) return { approved: false, reason: "Website must be a valid http/https URL.", source: "fallback" };
  if (!hasMeaningfulDescription(description)) return { approved: false, reason: "Company description must be meaningful (25+ characters, 5+ words) and not a placeholder.", source: "fallback" };
  if (documentUrls.length === 0) return { approved: false, reason: "At least one supporting verification document is required.", source: "fallback" };

  return { approved: true, reason: "Application passed automated validation checks.", source: "fallback" };
}

// ── Fetch document and return base64 + mimeType ───────────────────────────
interface FetchedDoc { mimeType: string; base64: string; bytes: number }

async function fetchDocumentForGemini(url: string): Promise<FetchedDoc | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Anasell-AI-Reviewer/1.0" },
    });
    if (!res.ok) return null;

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const mimeType = contentType || guessMimeFromUrl(url);

    if (!SUPPORTED_MIME.has(mimeType)) return null;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_INLINE_BYTES) return null;

    const base64 = Buffer.from(buffer).toString("base64");
    return { mimeType, base64, bytes: buffer.byteLength };
  } catch {
    return null;
  }
}

function guessMimeFromUrl(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf"))  return "application/pdf";
  if (lower.endsWith(".png"))  return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return "image/jpeg"; // default assumption for document uploads
}

// ── Build Gemini request parts ────────────────────────────────────────────
function buildTextPrompt(body: Record<string, unknown>, docCount: number, docsFetched: number): string {
  return `You are a strict compliance reviewer for Anasell, a regulated digital marketplace in South Sudan.

Your task is to approve or reject a company registration application. You have been given the application details AND the actual uploaded document(s) as attachments. Examine them carefully.

=== APPLICATION DETAILS ===
Company Name: ${String(body.company_name ?? "N/A")}
Industry: ${String(body.industry ?? "N/A")}
Description: ${String(body.description ?? "N/A")}
City: ${String(body.city ?? "N/A")}
Address: ${String(body.address ?? "N/A")}
Phone: ${String(body.phone ?? "N/A")}
Email: ${String(body.email ?? "N/A")}
Website: ${String(body.website ?? "N/A")}
Employee Count: ${String(body.size ?? "N/A")}
Documents submitted: ${docCount} (${docsFetched} loaded for visual review)

=== DOCUMENT REVIEW INSTRUCTIONS ===
${docsFetched > 0
  ? `You have ${docsFetched} document(s) attached below. For each document:
- Verify it looks like a genuine business registration, ID, certificate, or official document
- Check for visible company/person name, official stamps, signatures, or logos
- Flag any document that appears blank, invalid, unrelated, digitally fabricated, or is clearly a test/placeholder image
- Check that the name/company on the document is consistent with the application details`
  : "Documents could not be loaded for visual review. Evaluate based on application data alone."}

=== REVIEW CRITERIA (reject if ANY fail) ===
1. Company name must look like a real business — not a placeholder or random string.
2. Industry must be specified and consistent with the company name.
3. City and address must be present and realistic.
4. Phone must look realistic for the region.
5. Email must be a real business email — not disposable or example domains.
6. Description must clearly explain what the company does.
7. At least one document must be present and appear authentic.
8. Overall coherence: name, industry, description, location, and documents must be consistent.

Respond ONLY with valid JSON:
{"approved": true, "reason": "Brief reason"}
or
{"approved": false, "reason": "Specific issue"}`;
}

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

// ── Main handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  const localReview = await fallbackReview(body);
  if (!localReview.approved) return NextResponse.json(localReview);

  const apiKey = cleanSecret(
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
  );
  if (!apiKey) return NextResponse.json(localReview);

  const documentUrls: string[] = Array.isArray(body.document_urls)
    ? (body.document_urls as string[]).filter(Boolean) : [];

  // Fetch all document binaries in parallel (best-effort, timeout 10 s each)
  const fetchedDocs = (
    await Promise.all(documentUrls.map((url) => fetchDocumentForGemini(url)))
  ).filter((d): d is FetchedDoc => d !== null);

  // Build Gemini parts: text prompt first, then each document inline
  const parts: GeminiPart[] = [
    { text: buildTextPrompt(body, documentUrls.length, fetchedDocs.length) },
    ...fetchedDocs.map((doc) => ({
      inline_data: { mime_type: doc.mimeType, data: doc.base64 },
    })),
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 300,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(30000), // longer timeout when documents are attached
      }
    );

    if (!response.ok) return NextResponse.json(localReview);

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json(localReview);

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
