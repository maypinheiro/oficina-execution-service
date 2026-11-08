import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { MessageInbox } from "./idempotent-handler.js";
import { MessageEnvelope } from "./message-envelope.js";
export class DynamoDbMessageInbox implements MessageInbox {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}
  async claim(message: MessageEnvelope, hash: string): Promise<boolean> {
    try {
      await this.client.send(new PutCommand({ TableName: this.tableName, Item: { PK: `INBOX#${message.messageId}`, SK: "MESSAGE", entityType: "InboxMessage", messageType: message.messageType, correlationId: message.correlationId, sagaId: message.sagaId, payloadHash: hash, processedAt: new Date().toISOString(), expiresAt: Math.floor(Date.now() / 1000) + 1209600 }, ConditionExpression: "attribute_not_exists(PK)" }));
      return true;
    } catch (error) {
      if ((error as { name?: string }).name === "ConditionalCheckFailedException") return false;
      throw error;
    }
  }
}
