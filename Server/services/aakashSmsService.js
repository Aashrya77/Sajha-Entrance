const DEFAULT_AAKASH_SMS_URL = "https://sms.aakashsms.com/sms/v3/send/";
const DEFAULT_TIMEOUT_MS = 10000;

const normalizeNepalMobileNumber = (value = "") => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("977") && digits.length === 13) digits = digits.slice(3);
  return /^9[678]\d{8}$/.test(digits) ? digits : "";
};

const isAakashSmsConfigured = () => Boolean(String(process.env.AAKASH_SMS_AUTH_TOKEN || "").trim());

const sendAakashSms = async ({ to, text, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }) => {
  const authToken = String(process.env.AAKASH_SMS_AUTH_TOKEN || "").trim();
  const mobile = normalizeNepalMobileNumber(to);
  const message = String(text || "").trim();

  if (!authToken) throw new Error("AakashSMS is not configured.");
  if (!mobile) throw new Error("A valid Nepal mobile number is required.");
  if (!message) throw new Error("SMS message is required.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(process.env.AAKASH_SMS_API_URL || DEFAULT_AAKASH_SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ auth_token: authToken, to: mobile, text: message }),
      signal: controller.signal,
    });
    const rawBody = await response.text();
    let result;
    try {
      result = JSON.parse(rawBody);
    } catch {
      throw new Error(`AakashSMS returned an invalid response (${response.status}).`);
    }
    const validRecipients = result?.data?.valid;
    if (!response.ok || result?.error === true || !Array.isArray(validRecipients) || !validRecipients.length) {
      throw new Error(result?.message || `AakashSMS rejected the message (${response.status}).`);
    }
    return { message: result.message, mobile };
  } finally {
    clearTimeout(timeoutId);
  }
};

export { isAakashSmsConfigured, normalizeNepalMobileNumber, sendAakashSms };
