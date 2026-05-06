import nodemailer from "nodemailer";
import Setting from "../models/setting.model";

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const settings = await Setting.find();
  const config = settings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  if (!config.smtpUser || !config.smtpPass) {
    console.warn("SMTP settings not configured. Skipping email send.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  const mailOptions = {
    from: `"DS Engineosys" <${config.smtpUser}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}
