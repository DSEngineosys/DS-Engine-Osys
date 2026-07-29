import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.warn('[SMS] Twilio environment variables are not set. SMS sending will be disabled.');
}

/**
 * Sends an SMS message using Twilio.
 * @param to Recipient phone number in E.164 format (e.g., +1234567890)
 * @param body Text message body
 * @param otp Optional OTP code for logging purposes
 */
export async function sendSms(to: string, body: string, otp?: string): Promise<void> {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[SMS] Skipping send because Twilio credentials are missing');
    return;
  }
  const client = twilio(accountSid, authToken);
  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.info(`[SMS] Sent message to ${to}` + (otp ? ` (OTP: ${otp})` : ''));
  } catch (err) {
    console.error('[SMS] Failed to send message', err);
    throw err;
  }
}
