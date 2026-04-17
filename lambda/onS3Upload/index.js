/**
 * lambda/onS3Upload/index.js
 *
 * Trigger: S3 ObjectCreated event on your bucket
 * Purpose: Write file metadata to DynamoDB for fast listing
 *
 * Required env vars:
 *   TABLE_NAME  — DynamoDB table name (e.g. "dropcloud-files")
 *
 * DynamoDB schema:
 *   PK  (String) — userId  (e.g.  "us-east-1:abc123...")
 *   SK  (String) — fileKey (e.g.  "userId/filename.pdf")
 *   name         — original filename
 *   size         — file size in bytes
 *   contentType  — MIME type
 *   uploadedAt   — ISO timestamp
 */

const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamo = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const promises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size;

    // Key format: {userId}/{filename}
    const slashIdx = rawKey.indexOf('/');
    if (slashIdx === -1) return; // skip malformed keys

    const userId = rawKey.slice(0, slashIdx);
    const fileName = rawKey.slice(slashIdx + 1);
    const contentType = record.s3.object['content-type'] || 'application/octet-stream';

    await dynamo.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        userId:      { S: userId },
        fileKey:     { S: rawKey },
        name:        { S: fileName },
        size:        { N: String(size) },
        contentType: { S: contentType },
        uploadedAt:  { S: new Date().toISOString() },
        bucket:      { S: bucket },
      },
    }));

    console.log(`Recorded metadata for ${rawKey} (${size} bytes)`);
  });

  await Promise.all(promises);
  return { statusCode: 200 };
};
