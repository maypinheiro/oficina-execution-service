import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ExecutionStore } from "./execution-command-handler.js";
export class DynamoDbExecutionStore implements ExecutionStore {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}
  async start(orderId: string): Promise<{ executionId: string }> {
    const executionId = orderId;
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: { PK: `EXECUTION#${executionId}`, SK: "METADATA", GSI1PK: "STATUS#IN_EXECUTION", GSI1SK: `${new Date().toISOString()}#${executionId}`, entityType: "Execution", executionId, externalOrderId: orderId, status: "IN_EXECUTION", resourcesReserved: true, version: 0 }, ConditionExpression: "attribute_not_exists(PK)" }));
    return { executionId };
  }
  async complete(orderId: string): Promise<{ executionId: string }> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: `EXECUTION#${orderId}`, SK: "METADATA" },
      UpdateExpression: "SET #status = :completed, resourcesReserved = :released, GSI1PK = :gsi, updatedAt = :now ADD version :one",
      ConditionExpression: "#status = :inExecution",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":completed": "COMPLETED", ":inExecution": "IN_EXECUTION", ":released": false,
        ":gsi": "STATUS#COMPLETED", ":now": new Date().toISOString(), ":one": 1,
      },
    }));
    return { executionId: orderId };
  }
  async cancel(orderId: string): Promise<void> {
    await this.client.send(new UpdateCommand({ TableName: this.tableName, Key: { PK: `EXECUTION#${orderId}`, SK: "METADATA" }, UpdateExpression: "SET #status = :cancelled, resourcesReserved = :released, GSI1PK = :gsi, updatedAt = :now", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":cancelled": "CANCELLED", ":released": false, ":gsi": "STATUS#CANCELLED", ":now": new Date().toISOString() } }));
  }
}
