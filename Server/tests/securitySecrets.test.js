import assert from "node:assert/strict";
import test from "node:test";
import {
  assertProductionSecuritySecrets,
  getJwtSecret,
} from "../config/securitySecrets.js";

test("development does not require production secrets", () => {
  assert.doesNotThrow(() =>
    assertProductionSecuritySecrets({ NODE_ENV: "development" })
  );
});

test("production rejects missing and weak JWT or session secrets", () => {
  assert.throws(
    () => assertProductionSecuritySecrets({ NODE_ENV: "production" }),
    /JWT_SECRET, SESSION_SECRET/
  );
  assert.throws(
    () =>
      assertProductionSecuritySecrets({
        NODE_ENV: "production",
        JWT_SECRET: "j".repeat(32),
        SESSION_SECRET: "short",
      }),
    /SESSION_SECRET/
  );
});

test("production accepts JWT and session secrets of at least 32 bytes", () => {
  assert.doesNotThrow(() =>
    assertProductionSecuritySecrets({
      NODE_ENV: "production",
      JWT_SECRET: "j".repeat(32),
      SESSION_SECRET: "s".repeat(32),
    })
  );
});

test("JWT secret getter observes environment values loaded after module import", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "loaded-after-bootstrap";

  try {
    assert.equal(getJwtSecret(), "loaded-after-bootstrap");
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});
