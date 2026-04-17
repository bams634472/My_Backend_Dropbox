/**
 * lambda/getVersions/index.js
 *
 * Route: GET /versions?key=<fileKey>
 * Auth:  Cognito authorizer
 *
 * Required env vars:
 *   BUCKET_NAME — S3 bucket name
 *
 * Returns:
 *   { versions: [{ versionId, lastModified, size, isLatest, eTag }] }
 */

const { S3Client, ListObjectVersionsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.sub;

  if (!userId) {
    return {
      statusCode: 401,
      headers: CORS,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const fileKey = event.queryStringParameters?.key;
  if (!fileKey) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing key parameter' }),
    };
  }

  // Security: ensure the requested key belongs to the requesting user
  if (!fileKey.startsWith(`${userId}/`)) {
    return {
      statusCode: 403,
      headers: CORS,
      body: JSON.stringify({ error: 'Forbidden' }),
    };
  }

  try {
    const result = await s3.send(new ListObjectVersionsCommand({
      Bucket: BUCKET,
      Prefix: fileKey,
    }));

    const versions = (result.Versions || [])
      .filter(v => v.Key === fileKey) // exact match only
      .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
      .map(v => ({
        versionId:    v.VersionId,
        lastModified: v.LastModified,
        size:         v.Size,
        isLatest:     v.IsLatest,
        eTag:         v.ETag,
      }));

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ versions }),
    };
  } catch (err) {
    console.error('getVersions error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
