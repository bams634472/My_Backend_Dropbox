/**
 * lambda/listFiles/index.js
 *
 * Route: GET /files
 * Auth:  Cognito authorizer (userId extracted from JWT claims)
 * 
 * Required env vars:
 *   TABLE_NAME — DynamoDB table name
 *
 * Returns:
 *   { files: [{ fileKey, name, size, contentType, uploadedAt }] }
 */

const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamo = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // Extract userId from Cognito JWT claims injected by API GW authorizer
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

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': { S: userId } },
      ScanIndexForward: false, // newest first
    }));

    const files = (result.Items || []).map(unmarshall);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    };
  } catch (err) {
    console.error('listFiles error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
