// node --test apps/web/src/lib/range.test.ts (Node 24 ejecuta TypeScript sin compilar)
import assert from "node:assert/strict";
import { test } from "node:test";
import { contentRange } from "./range.ts";

test("offset + length", () => assert.deepEqual(contentRange({ offset: 0, length: 2 }, 100), { start: 0, end: 1 }));
test("offset hasta el final", () => assert.deepEqual(contentRange({ offset: 90 }, 100), { start: 90, end: 99 }));
test("sufijo (últimos N bytes)", () => assert.deepEqual(contentRange({ suffix: 10 }, 100), { start: 90, end: 99 }));
// "Range: bytes=0-" (lo que pide todo navegador para <video>): R2 trae las claves con undefined
const open = { offset: 0, length: undefined, suffix: undefined } as unknown as Parameters<typeof contentRange>[0];
test("bytes=0- con claves undefined", () => assert.deepEqual(contentRange(open, 100), { start: 0, end: 99 }));
test("bytes=90- con claves undefined", () => assert.deepEqual(contentRange({ ...open, offset: 90 }, 100), { start: 90, end: 99 }));
