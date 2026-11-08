import { MessageInbox, IdempotentMessageHandler } from "../messaging/idempotent-handler.js";
import { parseQueueBody } from "../messaging/message-envelope.js";
import { AwsMessageTransport } from "../messaging/aws-transport.js";
import { ExecutionCommandHandler } from "./execution-command-handler.js";
export class ExecutionMessageProcessor {
  private readonly idempotency: IdempotentMessageHandler;
  constructor(inbox: MessageInbox, private readonly handler: ExecutionCommandHandler, private readonly transport: AwsMessageTransport, private readonly topicArn: string) { this.idempotency = new IdempotentMessageHandler(inbox); }
  async process(body: string): Promise<"processed" | "duplicate"> {
    const command = parseQueueBody(body);
    return this.idempotency.handle(command, async () => this.transport.publishEvent(this.topicArn, await this.handler.handle(command)));
  }
}
