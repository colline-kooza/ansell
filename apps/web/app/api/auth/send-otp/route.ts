import crypto from "crypto";
import { Resend } from "resend";

const MAIL_FROM = process.env.MAIL_FROM ?? "ANASELL <info@desishub.com>";

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
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return Response.json({ success: false, message: "Email service is not configured" }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const window = Math.floor(Date.now() / (5 * 60 * 1000));
    const otp = generateOtp(email, window);

    const result = await resend.emails.send({
      from: MAIL_FROM,
      to: email,
      subject: "Your Anasell verification code",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your Anasell account</title>
</head>
<body style="margin:0;padding:0;background:#f4f8fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;font-weight:900;letter-spacing:-0.05em;color:#10210f;">Anasell</span>
              <br/>
              <span style="font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#5a7a57;">South Sudan&rsquo;s Digital Hub</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8e0;overflow:hidden;">

              <!-- Green top bar -->
              <div style="height:4px;background:linear-gradient(90deg,#4ade80,#22c55e);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 32px;">
                <tr>
                  <td>
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#10210f;letter-spacing:-0.02em;">Verify your account</h1>
                    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#5a7a57;">
                      Use the code below to complete your registration on Anasell.
                      It&rsquo;s valid for <strong>10 minutes</strong>.
                    </p>

                    <!-- OTP box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:24px 16px;background:#f0fdf4;border-radius:12px;border:2px dashed #86efac;">
                          <span style="font-size:42px;font-weight:800;letter-spacing:0.35em;color:#15803d;font-family:'Courier New',monospace;">${otp}</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
                      If you didn&rsquo;t create an Anasell account, you can safely ignore this email.
                      Someone may have entered your email address by mistake.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Anasell &mdash; South Sudan&rsquo;s Digital Hub
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return Response.json({ success: false, message: "Failed to send verification email" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return Response.json({ success: false, message: "Failed to send verification email" }, { status: 500 });
  }
}
