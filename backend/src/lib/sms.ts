

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.warn('[SMS] Twilio environment variables are not set. SMS sending will be disabled.');
}

/**
 * Sends an SMS message using Twilio via HTTP POST.
 * @param to Recipient phone number in E.164 format (e.g., +1234567890)
 * @param body Text message body
 * @param otp Optional OTP code for logging purposes
 */
export async function sendSms(to: string, body: string, otp?: string): Promise<void> {
  if (!accountSid || !authToken || !fromNumber) {
    const msg = '[SMS] Skipping send because Twilio credentials are missing. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.';
    console.warn(msg);
    throw new Error(msg);
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('To', to);
  formData.append('From', fromNumber);
  formData.append('Body', body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      body: formData.toString()
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(`Twilio API Error: ${data.message || response.statusText}`);
    }

    console.info(`[SMS] Sent message to ${to}` + (otp ? ` (OTP: ${otp})` : ''));
  } catch (err) {
    console.error('[SMS] Failed to send message via HTTP POST', err);
    throw err;
  }
}
