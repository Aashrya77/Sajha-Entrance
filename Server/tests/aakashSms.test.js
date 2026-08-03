import assert from "node:assert/strict";
import test from "node:test";

import { normalizeNepalMobileNumber, sendAakashSms } from "../services/aakashSmsService.js";

test("normalizes supported Nepal mobile formats", () => {
  assert.equal(normalizeNepalMobileNumber("9812345678"), "9812345678");
  assert.equal(normalizeNepalMobileNumber("+977 981-234-5678"), "9812345678");
  assert.equal(normalizeNepalMobileNumber("01-4411294"), "");
});

test("sends the documented AakashSMS v3 form payload", async () => {
  const previousToken = process.env.AAKASH_SMS_AUTH_TOKEN;
  process.env.AAKASH_SMS_AUTH_TOKEN = "test-token";
  let request;
  try {
    const result = await sendAakashSms({
      to: "+9779812345678",
      text: "Reset message",
      fetchImpl: async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({
          error: false,
          message: "1 message queued.",
          data: { valid: [{ mobile: "9779812345678", status: "queued" }], invalid: [] },
        }), { status: 200 });
      },
    });
    const body = new URLSearchParams(request.options.body);
    assert.equal(request.url, "https://sms.aakashsms.com/sms/v3/send/");
    assert.equal(body.get("auth_token"), "test-token");
    assert.equal(body.get("to"), "9812345678");
    assert.equal(body.get("text"), "Reset message");
    assert.equal(result.mobile, "9812345678");
  } finally {
    if (previousToken === undefined) delete process.env.AAKASH_SMS_AUTH_TOKEN;
    else process.env.AAKASH_SMS_AUTH_TOKEN = previousToken;
  }
});

test("rejects provider failures without exposing the auth token", async () => {
  const previousToken = process.env.AAKASH_SMS_AUTH_TOKEN;
  process.env.AAKASH_SMS_AUTH_TOKEN = "secret-token";
  try {
    await assert.rejects(
      sendAakashSms({
        to: "9812345678",
        text: "Reset message",
        fetchImpl: async () => new Response(JSON.stringify({
          error: true,
          message: "Not enough balance.",
          data: [],
        }), { status: 200 }),
      }),
      (error) => error.message === "Not enough balance." && !error.message.includes("secret-token")
    );
  } finally {
    if (previousToken === undefined) delete process.env.AAKASH_SMS_AUTH_TOKEN;
    else process.env.AAKASH_SMS_AUTH_TOKEN = previousToken;
  }
});
