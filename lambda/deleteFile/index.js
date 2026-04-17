/**
 * lambda/deleteFile/index.js
 *
 * Route: DELETE /files?key=<fileKey>
 * Auth:  Cognito authorizer
 *
 * Required env vars:
 *   BUCKET_NAME — S3 bucket name
 *   TABLE_NAME  — DynamoDB table name
 *
 * Deletes ALL versions of the object from S3, then removes the
 * DynamoDB metadata record.
 *
 * Returns: { deleted: true }
 */

const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');

const s3     = new S3Client({});
const dynamo = new DynamoDBClient({});
const BUCKET = process.env.BUCKET_NAME;
const TABLE  = process.env.TABLE_NAME;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.sub;

  if (!userId) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const fileKey = event.queryStringParameters?.key;
  if (!fileKey) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing key parameter' }) };
  }

  if (!fileKey.startsWith(`${userId}/`)) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  try {
    // 1. List all versions + delete markers
    const listed = await s3.send(new ListObjectVersionsCommand({ Bucket: BUCKET, Prefix: fileKey }));

    const toDelete = [
      ...(listed.Versions || []),
      ...(listed.DeleteMarkers || []),
    ]
      .filter(v => v.Key === fileKey)
      .map(v => ({ Key: v.Key, VersionId: v.VersionId }));

    if (toDelete.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: toDelete, Quiet: true },
      }));
    }

    // 2. Remove DynamoDB record
    await dynamo.send(new DeleteItemCommand({
      TableName: TABLE,
      Key: {
        userId:  { S: userId },
        fileKey: { S: fileKey },
      },
    }));

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleted: true, versionsRemoved: toDelete.length }),
    };
  } catch (err) {
    console.error('deleteFile error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
