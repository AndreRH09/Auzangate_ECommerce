// node --test apps/web/src/lib/range.test.ts (Node 24 ejecuta TypeScript sin compilar)
import assert from "node:assert/strict";
import { test } from "node:test";
import { contentRange } from "./range.ts";

test("offset + length", () => assert.deepEqual(contentRange({ offset: 0, length: 2 }, 100), { start: 0, end: 1 }));
test("offset hasta el final", () => assert.deepEqual(contentRange({ offset: 90 }, 100), { start: 90, end: 99 }));
test("sufijo (últimos N bytes)", () => assert.deepEqual(contentRange({ suffix: 10 }, 100), { start: 90, end: 99 }));
