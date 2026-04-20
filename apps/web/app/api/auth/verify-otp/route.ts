import crypto from "crypto";

function generateOtp(email: string, window: number): string {
  const secret = process.env.OTP_SECRET ?? "anasell-otp-2025";
  const hash = crypto
    .createHmac("sha256", secret)
    .update(`${email.toLowerCase()}:${window}`)
    .digest("hex");
  return (parseInt(hash.slice(0, 8), 16) % 1_000_000).toString().padStart(6, "0");
}

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return Response.json({ success: false, message: "Email and code are required" }, { status: 400 });
    }

    const currentWindow = Math.floor(Date.now() / (5 * 60 * 1000));
    // Accept current and previous 5-min window (10 min total grace period)
    const valid = [currentWindow, currentWindow - 1].some(
      (w) => generateOtp(email, w) === otp.toString().trim()
    );

    if (!valid) {
      return Response.json({ success: false, message: "Invalid or expired code. Please try again." });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("verify-otp error:", err);
    return Response.json({ success: false, message: "Verification failed" }, { status: 500 });
  }
}
