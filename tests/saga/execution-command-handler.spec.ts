import assert from "node:assert/strict";
import test from "node:test";
import { ExecutionCommandHandler, ExecutionStore } from "../../src/saga/execution-command-handler.js";
import { createMessageEnvelope } from "../../src/messaging/message-envelope.js";
const calls: string[] = [];
const store: ExecutionStore = {
  start: async () => { calls.push("start"); return { executionId: "exec-1" }; },
  complete: async () => { calls.push("complete"); return { executionId: "exec-1" }; },
  cancel: async () => { calls.push("cancel"); },
};
const command = (messageType: string) => createMessageEnvelope({ messageType, messageKind: "command", source: "os-service", aggregateId: "os-1", correlationId: "corr-1", sagaId: "saga-1", payload: {} });
test("starts execution and emits a correlated event", async () => { calls.length = 0; const input = command("StartExecution"); const event = await new ExecutionCommandHandler(store).handle(input); assert.equal(event.messageType, "ExecutionStarted"); assert.equal(event.causationId, input.messageId); assert.deepEqual(event.payload, { executionId: "exec-1" }); });
test("completes execution and emits a correlated event", async () => { calls.length = 0; const input = command("CompleteExecution"); const event = await new ExecutionCommandHandler(store).handle(input); assert.equal(event.messageType, "ExecutionCompleted"); assert.equal(event.causationId, input.messageId); assert.deepEqual(event.payload, { executionId: "exec-1" }); assert.deepEqual(calls, ["complete"]); });
test("cancels execution and releases resources through the store", async () => { calls.length = 0; const event = await new ExecutionCommandHandler(store).handle(command("CancelExecution")); assert.equal(event.messageType, "ExecutionCancelled"); assert.deepEqual(calls, ["cancel"]); });
test("rejects unknown commands", async () => { await assert.rejects(() => new ExecutionCommandHandler(store).handle(command("Unknown")), /nao suportado/); });
