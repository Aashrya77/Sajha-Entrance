import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";

import { firebaseAdminClient } from "../config/firebaseadmin.js";
import Student from "../models/Student.js";
import { firebaseLogin, login } from "../controllers/Auth.js";
import { authenticateAny } from "../middleware/auth_combined.js";
import {
  createAuthRateLimiters,
  createGlobalApiLimiter,
} from "../middleware/rateLimiters.js";

const startTestServer = async (app) => {
  const server = app.listen(0);
  await once(server, "listening");
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
};

const postJson = (baseUrl, path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const createResponse = () => {
  const state = {
    statusCode: 200,
    payload: null,
    cookies: [],
  };

  return {
    state,
    response: {
      status(code) {
        state.statusCode = code;
        return this;
      },
      json(payload) {
        state.payload = payload;
        return this;
      },
      cookie(name, value, options) {
        state.cookies.push({ name, value, options });
        return this;
      },
    },
  };
};

const withPatched = async (target, patches, fn) => {
  const originals = {};

  for (const [key, value] of Object.entries(patches)) {
    originals[key] = target[key];
    target[key] = value;
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      target[key] = value;
    }
  }
};

test("repeated registration attempts are rate limited by IP", async () => {
  const { registerIpLimiter, registerEmailLimiter } = createAuthRateLimiters({
    registerIpLimit: 3,
    registerEmailLimit: 100,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/register", registerIpLimiter, registerEmailLimiter, (_req, res) => {
    res.status(201).json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    const statuses = [];
    for (let index = 0; index < 4; index += 1) {
      const response = await postJson(server.baseUrl, "/api/student/register", {
        email: `student-${index}@example.com`,
      });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [201, 201, 201, 429]);
  } finally {
    await server.close();
  }
});

test("registration email rate limit normalizes account keys", async () => {
  const { registerIpLimiter, registerEmailLimiter } = createAuthRateLimiters({
    registerIpLimit: 100,
    registerEmailLimit: 2,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/register", registerIpLimiter, registerEmailLimiter, (_req, res) => {
    res.status(201).json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    const emails = [" TestStudent@example.com ", "teststudent@example.com", "TESTSTUDENT@example.com"];
    const statuses = [];
    for (const email of emails) {
      const response = await postJson(server.baseUrl, "/api/student/register", { email });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [201, 201, 429]);
  } finally {
    await server.close();
  }
});

test("different registration accounts behind one IP still hit the IP limiter", async () => {
  const { registerIpLimiter, registerEmailLimiter } = createAuthRateLimiters({
    registerIpLimit: 3,
    registerEmailLimit: 100,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/register", registerIpLimiter, registerEmailLimiter, (_req, res) => {
    res.status(201).json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    const statuses = [];
    for (let index = 0; index < 4; index += 1) {
      const response = await postJson(server.baseUrl, "/api/student/register", {
        email: `different-${index}@example.com`,
      });
      statuses.push(response.status);
    }

    assert.equal(statuses[3], 429);
    assert.deepEqual(statuses.slice(0, 3), [201, 201, 201]);
  } finally {
    await server.close();
  }
});

test("repeated failed login attempts are rate limited", async () => {
  const { loginIpLimiter, loginEmailLimiter } = createAuthRateLimiters({
    loginIpLimit: 2,
    loginEmailLimit: 100,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/login", loginIpLimiter, loginEmailLimiter, (_req, res) => {
    res.status(401).json({ success: false });
  });

  const server = await startTestServer(app);
  try {
    const statuses = [];
    for (let index = 0; index < 3; index += 1) {
      const response = await postJson(server.baseUrl, "/api/student/login", {
        email: `login-${index}@example.com`,
        password: "wrong",
      });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [401, 401, 429]);
  } finally {
    await server.close();
  }
});

test("login account rate limit normalizes email keys", async () => {
  const { loginIpLimiter, loginEmailLimiter } = createAuthRateLimiters({
    loginIpLimit: 100,
    loginEmailLimit: 2,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/login", loginIpLimiter, loginEmailLimiter, (_req, res) => {
    res.status(401).json({ success: false });
  });

  const server = await startTestServer(app);
  try {
    const emails = [" LoginStudent@example.com ", "loginstudent@example.com", "LOGINSTUDENT@example.com"];
    const statuses = [];
    for (const email of emails) {
      const response = await postJson(server.baseUrl, "/api/student/login", {
        email,
        password: "wrong",
      });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [401, 401, 429]);
  } finally {
    await server.close();
  }
});

test("successful login requests do not exhaust failed-login allowance", async () => {
  const { loginIpLimiter, loginEmailLimiter } = createAuthRateLimiters({
    loginIpLimit: 100,
    loginEmailLimit: 2,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/login", loginIpLimiter, loginEmailLimiter, (req, res) => {
    if (req.body?.password === "correct") {
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false });
  });

  const server = await startTestServer(app);
  try {
    for (let index = 0; index < 5; index += 1) {
      const response = await postJson(server.baseUrl, "/api/student/login", {
        email: " Student@Example.com ",
        password: "correct",
      });
      assert.equal(response.status, 200);
    }

    const failedOne = await postJson(server.baseUrl, "/api/student/login", {
      email: "student@example.com",
      password: "wrong",
    });
    const failedTwo = await postJson(server.baseUrl, "/api/student/login", {
      email: "STUDENT@example.com",
      password: "wrong",
    });
    const limited = await postJson(server.baseUrl, "/api/student/login", {
      email: "student@example.com",
      password: "wrong",
    });

    assert.equal(failedOne.status, 401);
    assert.equal(failedTwo.status, 401);
    assert.equal(limited.status, 429);
  } finally {
    await server.close();
  }
});

test("forgot-password attempts are rate limited by normalized email", async () => {
  const { forgotPasswordIpLimiter, forgotPasswordEmailLimiter } = createAuthRateLimiters({
    forgotPasswordIpLimit: 100,
    forgotPasswordEmailLimit: 2,
  });
  const app = express();
  app.use(express.json());
  app.post(
    "/api/student/forgot-password",
    forgotPasswordIpLimiter,
    forgotPasswordEmailLimiter,
    (_req, res) => {
      res.json({ success: true });
    }
  );

  const server = await startTestServer(app);
  try {
    const emails = [" ResetMe@example.com ", "resetme@example.com", "RESETME@example.com"];
    const statuses = [];
    for (const email of emails) {
      const response = await postJson(server.baseUrl, "/api/student/forgot-password", { email });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [200, 200, 429]);
  } finally {
    await server.close();
  }
});

test("reset-password attempts are rate limited by IP", async () => {
  const { resetPasswordLimiter } = createAuthRateLimiters({
    resetPasswordLimit: 2,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/reset-password/token", resetPasswordLimiter, (_req, res) => {
    res.json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    const statuses = [];
    for (let index = 0; index < 3; index += 1) {
      const response = await postJson(server.baseUrl, "/api/student/reset-password/token", {
        password: `new-password-${index}`,
      });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [200, 200, 429]);
  } finally {
    await server.close();
  }
});

test("rate-limit responses use HTTP 429 and stable JSON", async () => {
  const { registerIpLimiter } = createAuthRateLimiters({
    registerIpLimit: 1,
  });
  const app = express();
  app.use(express.json());
  app.post("/api/student/register", registerIpLimiter, (_req, res) => {
    res.status(201).json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    await postJson(server.baseUrl, "/api/student/register", { email: "first@example.com" });
    const response = await postJson(server.baseUrl, "/api/student/register", {
      email: "second@example.com",
    });
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "RATE_LIMITED");
    assert.ok(payload.error);
    assert.ok(response.headers.has("ratelimit"));
  } finally {
    await server.close();
  }
});

test("existing Firebase students can still log in through Firebase login", async () => {
  const studentId = new mongoose.Types.ObjectId();

  await withPatched(firebaseAdminClient, {
    verifyIdToken: async () => ({
      email: " Existing-Firebase@Example.com ",
      name: "Existing Firebase",
    }),
  }, async () => {
    await withPatched(Student, {
      findOne: async (query) => {
        assert.deepEqual(query, { email: "existing-firebase@example.com" });
        return {
          _id: studentId,
          email: "existing-firebase@example.com",
          studentId: "SE-0002",
          name: "Existing Firebase",
        };
      },
    }, async () => {
      const { state, response } = createResponse();
      await firebaseLogin({ body: { firebaseToken: "valid-token" } }, response);

      assert.equal(state.statusCode, 200);
      assert.equal(state.payload.success, true);
      assert.ok(state.payload.token);
      assert.equal(state.payload.data.email, "existing-firebase@example.com");
    });
  });
});

test("Firebase login no longer auto-creates students", async () => {
  const originalSave = Student.prototype.save;
  let saveCalled = false;

  await withPatched(firebaseAdminClient, {
    verifyIdToken: async () => ({
      email: "new-firebase@example.com",
      name: "New Firebase",
    }),
  }, async () => {
    await withPatched(Student, {
      findOne: async () => null,
    }, async () => {
      Student.prototype.save = async function savePatch() {
        saveCalled = true;
        return originalSave.call(this);
      };

      try {
        const { state, response } = createResponse();
        await firebaseLogin({ body: { firebaseToken: "valid-token" } }, response);

        assert.equal(state.statusCode, 403);
        assert.equal(state.payload.code, "REGISTRATION_REQUIRED");
        assert.equal(saveCalled, false);
      } finally {
        Student.prototype.save = originalSave;
      }
    });
  });
});

test("Firebase login limiter runs before Firebase token verification", async () => {
  const { firebaseLoginLimiter } = createAuthRateLimiters({
    firebaseLoginLimit: 2,
  });
  let verifyCalls = 0;
  const app = express();
  app.use(express.json());
  app.post("/api/student/firebase-login", firebaseLoginLimiter, (_req, res) => {
    verifyCalls += 1;
    res.status(401).json({ success: false });
  });

  const server = await startTestServer(app);
  try {
    const statuses = [];
    for (let index = 0; index < 3; index += 1) {
      const response = await postJson(server.baseUrl, "/api/student/firebase-login", {
        firebaseToken: `token-${index}`,
      });
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [401, 401, 429]);
    assert.equal(verifyCalls, 2);
  } finally {
    await server.close();
  }
});

test("authenticateAny no longer auto-creates students for Firebase tokens", async () => {
  let createCalled = false;

  await withPatched(firebaseAdminClient, {
    verifyIdToken: async () => ({
      email: "missing-student@example.com",
      name: "Missing Student",
    }),
  }, async () => {
    await withPatched(Student, {
      findOne: async () => null,
      create: async () => {
        createCalled = true;
        return null;
      },
    }, async () => {
      const { state, response } = createResponse();
      let nextCalled = false;

      await authenticateAny(
        {
          headers: { authorization: "Bearer firebase-token" },
          cookies: {},
        },
        response,
        () => {
          nextCalled = true;
        }
      );

      assert.equal(state.statusCode, 403);
      assert.equal(state.payload.code, "REGISTRATION_REQUIRED");
      assert.equal(nextCalled, false);
      assert.equal(createCalled, false);
    });
  });
});

test("an existing valid student can still log in", async () => {
  const studentId = new mongoose.Types.ObjectId();

  await withPatched(Student, {
    findOne: async (query) => {
      assert.deepEqual(query, { email: "student@example.com" });
      return {
        _id: studentId,
        studentId: "SE-0001",
        name: "Existing Student",
        email: "student@example.com",
        course: "BSc.CSIT",
        accountStatus: "Unpaid",
        comparePassword: async (password) => password === "correct-password",
      };
    },
  }, async () => {
    const { state, response } = createResponse();
    await login(
      { body: { email: " Student@Example.com ", password: "correct-password" } },
      response
    );

    assert.equal(state.statusCode, 200);
    assert.equal(state.payload.success, true);
    assert.ok(state.payload.token);
    assert.equal(state.payload.data.email, "student@example.com");
    assert.equal(state.cookies[0]?.name, "studentToken");
  });
});

test("existing Firebase students can still authenticate through authenticateAny", async () => {
  const studentId = new mongoose.Types.ObjectId();

  await withPatched(firebaseAdminClient, {
    verifyIdToken: async () => ({
      email: "existing-firebase@example.com",
      name: "Existing Firebase",
    }),
  }, async () => {
    await withPatched(Student, {
      findOne: async () => ({
        _id: studentId,
        email: "existing-firebase@example.com",
        studentId: "SE-0002",
      }),
    }, async () => {
      const { response } = createResponse();
      const req = {
        headers: { authorization: "Bearer firebase-token" },
        cookies: {},
      };
      let nextCalled = false;

      await authenticateAny(req, response, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(req.student.email, "existing-firebase@example.com");
      assert.equal(req.authType, "firebase");
    });
  });
});

test("normal API requests continue to work with the global limiter", async () => {
  const app = express();
  app.use("/api", createGlobalApiLimiter({ limit: 300 }));
  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  const server = await startTestServer(app);
  try {
    const response = await fetch(`${server.baseUrl}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "ok");
  } finally {
    await server.close();
  }
});

test("global limiter returns JSON 429 after its threshold", async () => {
  const app = express();
  app.use("/api", createGlobalApiLimiter({ limit: 2 }));
  app.get("/api/health", (_req, res) => {
    res.json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    const statuses = [];
    for (let index = 0; index < 3; index += 1) {
      const response = await fetch(`${server.baseUrl}/api/health`);
      statuses.push(response.status);

      if (response.status === 429) {
        const payload = await response.json();
        assert.equal(payload.success, false);
        assert.equal(payload.code, "RATE_LIMITED");
      }
    }

    assert.deepEqual(statuses, [200, 200, 429]);
  } finally {
    await server.close();
  }
});

test("Helmet security headers do not break basic backend routes", async () => {
  const app = express();
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.get("/api/health", (_req, res) => {
    res.json({ success: true });
  });

  const server = await startTestServer(app);
  try {
    const response = await fetch(`${server.baseUrl}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.has("content-security-policy"), false);
  } finally {
    await server.close();
  }
});
