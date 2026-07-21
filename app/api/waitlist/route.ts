import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "us-east-1" });

const LOGO_URL = "https://predifi-assets.s3.us-east-1.amazonaws.com/email/logo-icon-dark.png";

function buildConfirmationEmail(email: string, referralLink: string): string {
  const referralCode = referralLink.includes("?ref=")
    ? referralLink.split("?ref=")[1]
    : referralLink;

  const fullReferralUrl = referralCode
    ? `https://predifi.com/waitlist?ref=${referralCode}`
    : "https://predifi.com/waitlist";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You're on the Predifi waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#080808;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;">
  <div style="display:none;font-size:1px;color:#080808;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Congrats. You saw it before the masses did. The queue is real — so is the edge.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080808;min-height:100vh;">
    <tr>
      <td align="center" valign="top" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#0d0d0d;border:1px solid #1f1f1f;">
          <tr>
            <td height="2" style="background:linear-gradient(90deg,#22c55e 0%,#4ade80 50%,rgba(34,197,94,0) 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 40px 28px;border-bottom:1px solid #1a1a1a;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding-right:10px;">
                          <img src="${LOGO_URL}" alt="Predifi" width="28" height="28" style="display:block;width:28px;height:28px;" />
                        </td>
                        <td valign="middle">
                          <span style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;">PREDIFI</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#3a3a3a;">EARLY ACCESS // LOCKED IN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 40px 36px;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#0d1f12;border:1px solid #1f4d2b;padding:6px 12px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right:6px;vertical-align:middle;">
                          <div style="width:6px;height:6px;background:#22c55e;border-radius:50%;"></div>
                        </td>
                        <td style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#22c55e;">ACCESS SECURED</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 16px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;line-height:1.1;">
                YOU'RE IN.<br/>
                <span style="color:#22c55e;">EARLY.</span>
              </h1>
              <p style="margin:0 0 8px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:13px;color:#888888;line-height:1.7;letter-spacing:0.04em;">
                Most people will discover Predifi <em>after</em> the opportunity. Not you.
              </p>
              <p style="margin:0 0 24px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:13px;color:#555555;line-height:1.7;letter-spacing:0.04em;">
                Consider your spot secured. We'll land back in this inbox when it's go time. Until then — keep predicting.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;background-color:#0a1a0e;border:1px solid #163522;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="width:18px;padding-top:1px;">
                          <span style="font-size:14px;">&#127881;</span>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="margin:0 0 3px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#22c55e;">Early joiners get rewarded</p>
                          <p style="margin:0;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#1e5e30;line-height:1.6;letter-spacing:0.02em;">Being this early means something. We're saving exclusive perks for wallets that were here before the crowd — think fee discounts, early credit allocations, and early-access features. Details drop closer to launch.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #141414;">
                    <p style="margin:0 0 14px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#22c55e;">THE MARKET ON YOU</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:5px 0;border-top:1px solid #141414;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;letter-spacing:0.04em;">Becomes a prediction addict</td>
                              <td align="right" style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;color:#22c55e;letter-spacing:0.06em;">94%</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;border-top:1px solid #141414;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;letter-spacing:0.04em;">Tells at least 3 friends</td>
                              <td align="right" style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;color:#e0e0e0;letter-spacing:0.06em;">87%</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;border-top:1px solid #141414;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;letter-spacing:0.04em;">Opens the app within 60 seconds of launch</td>
                              <td align="right" style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;color:#e0e0e0;letter-spacing:0.06em;">99%</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;border-top:1px solid #141414;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;letter-spacing:0.04em;">Brags about being early (at least once)</td>
                              <td align="right" style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;color:#e0e0e0;letter-spacing:0.06em;">100%</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr><td height="1" style="background-color:#1a1a1a;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 6px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#3a3a3a;">MOVE UP THE QUEUE</p>
                    <p style="margin:0 0 16px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;line-height:1.6;letter-spacing:0.02em;">
                      Every friend you recruit jumps you ahead. Your link, your leverage.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="background-color:#111111;border:1px solid #252525;padding:12px 16px;">
                          <span style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:11px;color:#cccccc;letter-spacing:0.04em;word-break:break-all;">
                            ${fullReferralUrl}
                          </span>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#22c55e;padding:11px 24px;">
                          <a href="${fullReferralUrl}" style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#080808;text-decoration:none;display:block;">
                            RECRUIT YOUR CREW &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#0a0a0a;border:1px solid #1f1f1f;padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0 0 2px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;font-weight:700;color:#e0e0e0;letter-spacing:0.08em;text-transform:uppercase;">Follow us for launch updates</p>
                          <p style="margin:0;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#444444;line-height:1.5;letter-spacing:0.02em;">Market signals, launch news, and things worth betting on.</p>
                        </td>
                        <td align="right" valign="middle" style="padding-left:16px;white-space:nowrap;">
                          <a href="https://x.com/predifi_com" style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#080808;text-decoration:none;background-color:#ffffff;padding:8px 16px;display:inline-block;">&#120143; @PREDIFI_COM</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#3a3a3a;">WHAT YOU'RE ACTUALLY GETTING</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:12px 0;border-top:1px solid #141414;vertical-align:top;width:20px;padding-right:12px;">
                          <div style="width:4px;height:4px;background:#22c55e;margin-top:5px;"></div>
                        </td>
                        <td style="padding:12px 0;border-top:1px solid #141414;vertical-align:top;">
                          <p style="margin:0 0 2px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:11px;font-weight:600;color:#e0e0e0;letter-spacing:0.06em;text-transform:uppercase;">Prediction Markets</p>
                          <p style="margin:0;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;line-height:1.6;letter-spacing:0.02em;">Put your money where your brain is. Trade outcomes on finance, geopolitics, macro — before the crowd catches up.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-top:1px solid #141414;vertical-align:top;width:20px;padding-right:12px;">
                          <div style="width:4px;height:4px;background:#22c55e;margin-top:5px;"></div>
                        </td>
                        <td style="padding:12px 0;border-top:1px solid #141414;vertical-align:top;">
                          <p style="margin:0 0 8px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:11px;font-weight:600;color:#e0e0e0;letter-spacing:0.06em;text-transform:uppercase;">Multi-Chain</p>
                          <p style="margin:0 0 10px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;line-height:1.6;letter-spacing:0.02em;">Your chain, your rules. We're not picking winners — we're building everywhere.</p>
                          <p style="margin:0;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;letter-spacing:0.1em;line-height:1.8;">
                            <span style="color:#aaaaaa;background-color:#111;border:1px solid #252525;padding:2px 7px;margin-right:4px;margin-bottom:4px;display:inline-block;">HEDERA</span>
                            <span style="color:#aaaaaa;background-color:#111;border:1px solid #252525;padding:2px 7px;margin-right:4px;margin-bottom:4px;display:inline-block;">ARBITRUM</span>
                            <span style="color:#aaaaaa;background-color:#111;border:1px solid #252525;padding:2px 7px;margin-right:4px;margin-bottom:4px;display:inline-block;">BASE</span>
                            <span style="color:#aaaaaa;background-color:#111;border:1px solid #252525;padding:2px 7px;margin-right:4px;margin-bottom:4px;display:inline-block;">OPTIMISM</span>
                            <span style="color:#aaaaaa;background-color:#111;border:1px solid #252525;padding:2px 7px;margin-right:4px;margin-bottom:4px;display:inline-block;">INK</span>
                            <span style="color:#aaaaaa;background-color:#111;border:1px solid #252525;padding:2px 7px;margin-right:4px;margin-bottom:4px;display:inline-block;">BNB CHAIN</span>
                            <span style="color:#555;background-color:#0d0d0d;border:1px solid #1a1a1a;padding:2px 7px;margin-bottom:4px;display:inline-block;">+ MORE</span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-top:1px solid #141414;vertical-align:top;width:20px;padding-right:12px;">
                          <div style="width:4px;height:4px;background:#22c55e;margin-top:5px;"></div>
                        </td>
                        <td style="padding:12px 0;border-top:1px solid #141414;vertical-align:top;">
                          <p style="margin:0 0 2px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:11px;font-weight:600;color:#e0e0e0;letter-spacing:0.06em;text-transform:uppercase;">Predifi World Index</p>
                          <p style="margin:0;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:10px;color:#555555;line-height:1.6;letter-spacing:0.02em;">One number. The collective intelligence of every market, every chain, every bet — distilled into a signal the world doesn't have yet.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #141414;background-color:#0a0a0a;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#333333;">
                      <a href="https://predifi.com" style="color:#444444;text-decoration:none;">Home</a>
                      &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                      <a href="https://predifi.com/pwi" style="color:#444444;text-decoration:none;">World Index</a>
                      &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                      <a href="https://predifi.com/tos" style="color:#444444;text-decoration:none;">Terms</a>
                      &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                      <a href="https://predifi.com/privacy" style="color:#444444;text-decoration:none;">Privacy</a>
                    </p>
                    <p style="margin:0 0 8px;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;color:#2a2a2a;line-height:1.6;letter-spacing:0.04em;">
                      You received this because you signed up at predifi.com.<br/>
                      To unsubscribe, <a href="https://predifi.com/waitlist/unsubscribe?email=${encodeURIComponent(email)}" style="color:#333333;text-decoration:underline;">click here</a>.
                    </p>
                    <p style="margin:0;font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;color:#222222;letter-spacing:0.06em;">
                      &copy; 2026 Predifi. All rights reserved.
                    </p>
                  </td>
                  <td align="right" valign="bottom">
                    <span style="font-family:'JetBrains Mono','Fira Code','Cascadia Code','Courier New',Courier,monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#1f1f1f;">hello@predifi.com</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td height="1" style="background:#1a1a1a;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, referral_link, already_registered } = body as {
      email?: string;
      referral_link?: string;
      already_registered?: boolean;
    };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Send SES confirmation email only for new signups
    if (!already_registered) {
      const htmlBody = buildConfirmationEmail(normalizedEmail, referral_link ?? "");
      try {
        await ses.send(new SendEmailCommand({
          Source: "Predifi <noreply@predifi.com>",
          Destination: { ToAddresses: [normalizedEmail] },
          Message: {
            Subject: { Data: "you're in. don't tell everyone. 👀", Charset: "UTF-8" },
            Body: {
              Html: { Data: htmlBody, Charset: "UTF-8" },
              Text: { Data: `You're on the Predifi waitlist.\n\nYour referral link: ${referral_link ?? "https://predifi.com/waitlist"}\n\nShare it — every friend who joins moves you up the queue.\n\n© 2026 Predifi`, Charset: "UTF-8" },
            },
          },
        }));
      } catch (emailErr) {
        console.error("[Waitlist SES] Failed to send confirmation:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Waitlist API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
