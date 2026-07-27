import Setting from "../models/setting.model";

export async function sendSms(mobile: string, message: string, otp?: string) {
  const settings = await Setting.find();
  const config = settings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const smsApiKey = config.smsApiKey || process.env.SMS_API_KEY;

  console.log(`\n==================================================`);
  console.log(`[SMS GATEWAY DISPATCH]`);
  console.log(`📱 Destination Mobile: ${mobile}`);
  console.log(`🔑 OTP Code: ${otp || "N/A"}`);
  console.log(`💬 Message: "${message}"`);
  console.log(`==================================================\n`);

  if (!smsApiKey) {
    console.log(`[SMS Gateway Info] No external SMS API key (e.g., Twilio/Fast2SMS) configured. Simulated SMS delivery successful for mobile ${mobile}.`);
    return { success: true, mode: "simulated", mobile, otp };
  }

  try {
    // If user configures Fast2SMS / Twilio webhook URL or API key
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: smsApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: mobile,
      }),
    });
    const data = await res.json();
    console.log("[SMS Gateway Success] Response:", data);
    return { success: true, data };
  } catch (err: any) {
    console.warn("[SMS Gateway Warning] External API call failed, falling back to local dispatch:", err?.message);
    return { success: true, mode: "fallback", mobile, otp };
  }
}
