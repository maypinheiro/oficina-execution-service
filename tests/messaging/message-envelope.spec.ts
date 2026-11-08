import assert from "node:assert/strict";
import test from "node:test";
import { assertMessageEnvelope, createMessageEnvelope, parseQueueBody } from "../../src/messaging/message-envelope.js";
import { IdempotentMessageHandler, MessageInbox } from "../../src/messaging/idempotent-handler.js";
const build = () => createMessageEnvelope({ messageType: "execution.start.requested", messageKind: "command", source: "os-service", aggregateId: "os-1", correlationId: "corr-1", payload: { orderId: "os-1" } });
test("validates the versioned contract", () => { const item = build(); assert.equal(parseQueueBody(JSON.stringify(item)).messageId, item.messageId); assert.equal(item.version, 1); });
test("does not execute duplicate delivery", async () => { const ids = new Set<string>(); const inbox: MessageInbox = { claim: async (item) => !ids.has(item.messageId) && Boolean(ids.add(item.messageId)) }; const handler = new IdempotentMessageHandler(inbox); const item = build(); let calls = 0; await handler.handle(item, async () => { calls++; }); await handler.handle(item, async () => { calls++; }); assert.equal(calls, 1); });
test("rejects incompatible envelopes", () => { assert.throws(() => assertMessageEnvelope(null)); assert.throws(() => assertMessageEnvelope({ ...build(), messageKind: "invalid" })); assert.throws(() => assertMessageEnvelope({ ...build(), version: 0 })); assert.throws(() => assertMessageEnvelope({ ...build(), occurredAt: "invalid" })); const { payload: _, ...withoutPayload } = build(); assert.throws(() => assertMessageEnvelope(withoutPayload)); });
