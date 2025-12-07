/**
 * Lambda function for retrieving smoking spots
 * Supports pagination, filtering by location, and type
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SPOTS_TABLE = process.env.SPOTS_TABLE || 'smoking-spots';

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const queryParams = event.queryStringParameters || {};

    // Parse query parameters
    const lat = parseFloat(queryParams.lat);
    const lng = parseFloat(queryParams.lng);
    const radius = parseFloat(queryParams.radius) || 5; // Default 5km
    const type = queryParams.type; // 'allowed' or 'forbidden'
    const limit = Math.min(parseInt(queryParams.limit) || 100, 500);
    const lastKey = queryParams.lastKey ? JSON.parse(queryParams.lastKey) : undefined;

    // Build scan parameters
    const scanParams = {
      TableName: SPOTS_TABLE,
      Limit: limit * 2, // Fetch more to filter by distance
      ExclusiveStartKey: lastKey
    };

    // Add type filter if specified
    if (type && ['allowed', 'forbidden'].includes(type)) {
      scanParams.FilterExpression = '#type = :type';
      scanParams.ExpressionAttributeNames = { '#type': 'type' };
      scanParams.ExpressionAttributeValues = { ':type': type };
    }

    const result = await docClient.send(new ScanCommand(scanParams));
    let spots = result.Items || [];

    // Filter by distance if location provided
    if (!isNaN(lat) && !isNaN(lng)) {
      spots = spots
        .map(spot => ({
          ...spot,
          distance: calculateDistance(lat, lng, spot.lat, spot.lng)
        }))
        .filter(spot => spot.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    }

    // Limit results
    spots = spots.slice(0, limit);

    // Remove sensitive fields
    spots = spots.map(spot => ({
      id: spot.id,
      name: spot.name,
      address: spot.address,
      memo: spot.memo,
      type: spot.type,
      lat: spot.lat,
      lng: spot.lng,
      hasRoof: spot.hasRoof,
      hasChair: spot.hasChair,
      isEnclosed: spot.isEnclosed,
      is24Hours: spot.is24Hours,
      photos: spot.photos || [],
      source: spot.source,
      distance: spot.distance
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        spots,
        count: spots.length,
        lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
