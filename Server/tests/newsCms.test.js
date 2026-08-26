import assert from "node:assert/strict";
import test from "node:test";

import NewsModel, { buildPublicNewsFilter } from "../models/News.js";
import { getNewsDetail, getNewsList } from "../controllers/News.js";
import { enforceNewsPublishPermission } from "../admin/resources/news.resource.js";
import { sanitizeRichHtml } from "../utils/htmlSanitizer.js";
import { seedCollection } from "../scripts/seedNewsEventsFromStaticContent.js";

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

test("rich HTML sanitizer strips executable markup and unsafe URLs", () => {
  const sanitized = sanitizeRichHtml(`
    <script>alert(1)</script>
    <img src="x" onerror="alert(2)">
    <a href="javascript:alert(3)" onclick="alert(4)">bad</a>
    <a href="https://sajhaentrance.org/news">good</a>
    <iframe src="https://example.com"></iframe>
  `);

  assert.doesNotMatch(sanitized, /script/i);
  assert.doesNotMatch(sanitized, /onerror|onclick/i);
  assert.doesNotMatch(sanitized, /javascript:/i);
  assert.doesNotMatch(sanitized, /iframe/i);
  assert.match(sanitized, /https:\/\/sajhaentrance\.org\/news/);
});

test("public News detail lookup uses only slug or legacyId and applies published visibility", async () => {
  let capturedQuery = null;

  await withPatched(
    NewsModel,
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
      await getNewsDetail({ params: { identifier: "507f1f77bcf86cd799439011" } }, response);

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

test("public News list enforces maximum pagination limit and escapes search", async () => {
  let capturedLimit = 0;
  let capturedQuery = null;

  await withPatched(
    NewsModel,
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
      await getNewsList(
        { query: { page: "1", limit: "999", search: "{$ne:null}" } },
        response
      );

      assert.equal(state.statusCode, 200);
      assert.equal(capturedLimit, 24);
      assert.equal(JSON.stringify(capturedQuery).includes("$ne"), false);
    }
  );
});

test("News public visibility filter requires a deterministic publication time", () => {
  const filter = buildPublicNewsFilter(new Date("2026-08-26T00:00:00.000Z"));

  assert.equal(filter.status, "published");
  assert.match(JSON.stringify(filter), /publishAt/);
  assert.match(JSON.stringify(filter), /publishedAt/);
});

test("editor user without News publish permission cannot publish through AdminJS payload", () => {
  assert.throws(() => {
    enforceNewsPublishPermission(
      { method: "post", payload: { status: "published" } },
      {
        currentAdmin: {
          role: "manager",
          permissions: { news: { view: true, edit: true, publish: false } },
        },
        record: { params: { status: "draft" } },
      }
    );
  }, /validation errors/i);
});

test("News model sanitizes rich content before validation", async () => {
  await withPatched(NewsModel, { exists: async () => false }, async () => {
    const record = new NewsModel({
      title: "Safe News",
      excerpt: "A safe excerpt.",
      content: '<p>Hello</p><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>',
      status: "published",
    });

    await record.validate();

    assert.doesNotMatch(record.content, /onerror|javascript:/i);
    assert.ok(record.publishedAt instanceof Date);
  });
});

test("legacy News seed summary is idempotent and skips existing records", async () => {
  const fakeModel = {
    findOne() {
      return {
        select() {
          return {
            lean: async () => ({ _id: "existing", slug: "legacy-one", legacyId: "legacy-one" }),
          };
        },
      };
    },
  };

  const summary = await seedCollection({
    label: "News",
    model: fakeModel,
    items: [{ id: "legacy-one", title: "Legacy One" }],
    buildPayload: async () => {
      throw new Error("buildPayload should not run for existing records in dry-run mode");
    },
  });

  assert.equal(summary.totalStatic, 1);
  assert.equal(summary.skippedExisting, 1);
  assert.equal(summary.wouldCreate, 0);
});
