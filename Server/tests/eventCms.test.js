import assert from "node:assert/strict";
import test from "node:test";

import EventModel from "../models/Event.js";
import { deriveEventState, getEventDetail, getEventList } from "../controllers/Event.js";
import { enforceEventPublishPermission } from "../admin/resources/event.resource.js";

const createResponse = () => {
  const state = { statusCode: 200, payload: null, headers: {} };
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
      set(name, value) {
        state.headers[name] = value;
        return this;
      },
    },
  };
};

const withPatched = async (target, patches, fn) => {
  const originals = {};
  Object.entries(patches).forEach(([key, value]) => {
    originals[key] = target[key];
    target[key] = value;
  });

  try {
    return await fn();
  } finally {
    Object.entries(originals).forEach(([key, value]) => {
      target[key] = value;
    });
  }
};

const createFindChain = ({ records = [], onLimit, onQuery } = {}) => {
  const chain = {
    select() {
      return chain;
    },
    sort() {
      return chain;
    },
    skip() {
      return chain;
    },
    limit(value) {
      onLimit?.(value);
      return chain;
    },
    lean() {
      return Promise.resolve(records);
    },
  };

  return (query) => {
    onQuery?.(query);
    return chain;
  };
};

test("Event lifecycle is derived from startAt and endAt", () => {
  const now = new Date("2026-08-26T12:00:00.000Z");

  assert.equal(
    deriveEventState("2026-09-01T00:00:00.000Z", "2026-09-01T02:00:00.000Z", now),
    "upcoming"
  );
  assert.equal(
    deriveEventState("2026-08-26T10:00:00.000Z", "2026-08-26T13:00:00.000Z", now),
    "ongoing"
  );
  assert.equal(
    deriveEventState("2026-08-01T00:00:00.000Z", "2026-08-01T02:00:00.000Z", now),
    "completed"
  );
});

test("Event model rejects endAt before startAt", async () => {
  await withPatched(EventModel, { exists: async () => false }, async () => {
    const record = new EventModel({
      title: "Invalid Event",
      excerpt: "Invalid date order.",
      content: "<p>Invalid</p>",
      startAt: new Date("2026-08-26T12:00:00.000Z"),
      endAt: new Date("2026-08-26T11:00:00.000Z"),
      status: "draft",
    });

    await assert.rejects(() => record.validate(), /end date\/time must not be before/i);
  });
});

test("public Event detail lookup uses only slug or legacyId and applies published visibility", async () => {
  let capturedQuery = null;

  await withPatched(
    EventModel,
    {
      findOne(query) {
        capturedQuery = query;
        return {
          select() {
            return {
              lean: async () => null,
            };
          },
        };
      },
    },
    async () => {
      const { state, response } = createResponse();
      await getEventDetail({ params: { identifier: "507f1f77bcf86cd799439011" } }, response);

      assert.equal(state.statusCode, 404);
      assert.deepEqual(capturedQuery.$and[1].$or, [
        { slug: "507f1f77bcf86cd799439011" },
        { legacyId: "507f1f77bcf86cd799439011" },
      ]);
      assert.equal(JSON.stringify(capturedQuery).includes('"_id"'), false);
      assert.equal(capturedQuery.$and[0].status, "published");
    }
  );
});

test("public Event list enforces maximum pagination limit and escapes search", async () => {
  let capturedLimit = 0;
  let capturedQuery = null;

  await withPatched(
    EventModel,
    {
      countDocuments: async () => 0,
      find: createFindChain({
        records: [],
        onLimit: (value) => {
          capturedLimit = value;
        },
        onQuery: (query) => {
          capturedQuery = query;
        },
      }),
      distinct: async () => [],
    },
    async () => {
      const { state, response } = createResponse();
      await getEventList(
        { query: { page: "1", limit: "999", search: "{$ne:null}" } },
        response
      );

      assert.equal(state.statusCode, 200);
      assert.equal(capturedLimit, 30);
      assert.equal(JSON.stringify(capturedQuery).includes("$ne"), false);
    }
  );
});

test("editor user without Events publish permission cannot publish through AdminJS payload", () => {
  assert.throws(() => {
    enforceEventPublishPermission(
      { method: "post", payload: { status: "published" } },
      {
        currentAdmin: {
          role: "manager",
          permissions: { events: { view: true, edit: true, publish: false } },
        },
        record: { params: { status: "draft" } },
      }
    );
  }, /validation errors/i);
});
