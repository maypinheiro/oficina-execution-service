import { createMessageEnvelope, MessageEnvelope } from "../messaging/message-envelope.js";
export interface ExecutionStore {
  start(orderId: string, payload: unknown): Promise<{ executionId: string }>;
  cancel(orderId: string): Promise<void>;
}
export class ExecutionCommandHandler {
  constructor(private readonly store: ExecutionStore) {}
  async handle(command: MessageEnvelope): Promise<MessageEnvelope> {
    let messageType: string; let payload: Record<string, unknown> = {};
    if (command.messageType === "StartExecution") { messageType = "ExecutionStarted"; payload = await this.store.start(command.aggregateId, command.payload); }
    else if (command.messageType === "CancelExecution") { await this.store.cancel(command.aggregateId); messageType = "ExecutionCancelled"; }
    else throw new Error(`Comando Execution nao suportado: ${command.messageType}`);
    return createMessageEnvelope({ messageType, messageKind: "event", source: "execution-service", aggregateId: command.aggregateId, correlationId: command.correlationId, causationId: command.messageId, sagaId: command.sagaId, payload });
  }
}
