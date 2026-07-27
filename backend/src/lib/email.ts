import nodemailer from "nodemailer";
import Setting from "../models/setting.model";

export async function getSmtpConfig() {
  const settings = await Setting.find();
  const config = settings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  let smtpUser = config.smtpUser || process.env.SMTP_USER || "";
  let smtpPass = config.smtpPass || process.env.SMTP_PASS || "";
  const smtpHost = config.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(config.smtpPort || process.env.SMTP_PORT || 587);

  smtpUser = smtpUser.trim();
  if (smtpPass) {
    // Strip spaces/dashes that users often include when pasting 16-char App Passwords
    smtpPass = smtpPass.replace(/\s+/g, "").trim();
  }

  // Detect placeholder values
  const isPlaceholderUser = !smtpUser || smtpUser.includes("your-email") || smtpUser.includes("your-app");
  const isPlaceholderPass = !smtpPass || smtpPass.includes("xxxx") || smtpPass.includes("change");
  
  let adminEmail = config.adminEmail || process.env.ADMIN_EMAIL || "";
  const isPlaceholderAdmin = !adminEmail || adminEmail.includes("example.com") || adminEmail.includes("your-email");

  const validSmtpUser = isPlaceholderUser ? "" : smtpUser;

  return {
    smtpUser: validSmtpUser,
    smtpPass: isPlaceholderPass ? "" : smtpPass,
    smtpHost,
    smtpPort,
    adminEmail: isPlaceholderAdmin ? validSmtpUser : adminEmail,
  };
}

function createTransporter(smtpHost: string, smtpPort: number, smtpUser: string, smtpPass: string) {
  const isSecure = smtpPort === 465;
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure, // true for 465, false for 587/other
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed SSL cert block issues
    },
    connectionTimeout: 10000, // 10s timeout
  });
}

function formatSmtpError(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes("535") || msg.includes("Username and Password not accepted") || msg.includes("Invalid login")) {
    return "Gmail authentication failed (Error 535). Please ensure 2-Step Verification is ON in your Google Account, and use a 16-letter App Password (generated at myaccount.google.com/apppasswords), NOT your normal Gmail login password.";
  }
  if (msg.includes("ETIMEDOUT") || msg.includes("ESOCKET")) {
    return `Connection to ${err?.address || "SMTP server"} timed out on port ${err?.port || ""}. Check your internet connection or try changing SMTP port from 465 to 587.`;
  }
  return msg;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const { smtpUser, smtpPass, smtpHost, smtpPort } = await getSmtpConfig();

  if (!smtpUser || !smtpPass) {
    console.warn("[SMTP Warning] SMTP credentials missing or incomplete. Skipping email send.");
    return { success: false, reason: "SMTP credentials (user/password) not configured in Admin Dashboard." };
  }

  const mailOptions = {
    from: `"DS Engineosys" <${smtpUser}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    let transporter = createTransporter(smtpHost, smtpPort, smtpUser, smtpPass);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (primaryErr: any) {
    // If port 465 failed, try automatic fallback to port 587 (or vice versa for Gmail)
    const fallbackPort = smtpPort === 465 ? 587 : 465;
    console.warn(`[SMTP Fallback] Primary attempt failed on port ${smtpPort}. Trying fallback port ${fallbackPort}...`);
    try {
      const fallbackTransporter = createTransporter(smtpHost, fallbackPort, smtpUser, smtpPass);
      const info = await fallbackTransporter.sendMail(mailOptions);
      console.log(`[SMTP Success] Email sent via fallback port ${fallbackPort} to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (fallbackErr: any) {
      const friendlyMsg = formatSmtpError(primaryErr);
      console.error("[SMTP Error] Failed to send email:", friendlyMsg);
      throw new Error(friendlyMsg);
    }
  }
}

export async function verifySmtpConnection() {
  const { smtpUser, smtpPass, smtpHost, smtpPort } = await getSmtpConfig();
  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP User or Password is not configured. Please enter your Gmail address and 16-character App Password in the fields above and click Save.");
  }

  try {
    const transporter = createTransporter(smtpHost, smtpPort, smtpUser, smtpPass);
    await transporter.verify();
    return true;
  } catch (primaryErr: any) {
    const fallbackPort = smtpPort === 465 ? 587 : 465;
    try {
      const fallbackTransporter = createTransporter(smtpHost, fallbackPort, smtpUser, smtpPass);
      await fallbackTransporter.verify();
      return true;
    } catch (fallbackErr) {
      throw new Error(formatSmtpError(primaryErr));
    }
  }
}

