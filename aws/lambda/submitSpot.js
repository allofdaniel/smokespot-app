/**
 * Lambda function for submitting new smoking spot requests
 * Stores in DynamoDB and triggers email notification
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

const SPOTS_TABLE = process.env.SPOTS_TABLE || 'smoking-spots';
const PENDING_TABLE = process.env.PENDING_TABLE || 'smoking-spots-pending';
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@smokespot.app';

// Input validation
function validateInput(data) {
  const errors = [];

  if (!data.name || data.name.length < 2 || data.name.length > 100) {
    errors.push('Name must be 2-100 characters');
  }

  if (typeof data.lat !== 'number' || data.lat < -90 || data.lat > 90) {
    errors.push('Invalid latitude');
  }

  if (typeof data.lng !== 'number' || data.lng < -180 || data.lng > 180) {
    errors.push('Invalid longitude');
  }

  if (!['allowed', 'forbidden'].includes(data.type)) {
    errors.push('Type must be "allowed" or "forbidden"');
  }

  if (!data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
    errors.push('At least one photo is required');
  }

  if (data.photos && data.photos.length > 5) {
    errors.push('Maximum 5 photos allowed');
  }

  return errors;
}

// Sanitize input to prevent XSS
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Validate input
    const validationErrors = validateInput(body);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validationErrors
        })
      };
    }

    // Get user info from Cognito authorizer (if authenticated)
    const userId = event.requestContext?.authorizer?.claims?.sub || 'anonymous';
    const userEmail = event.requestContext?.authorizer?.claims?.email || null;

    // Create pending spot record
    const spotId = uuidv4();
    const timestamp = new Date().toISOString();

    const pendingSpot = {
      id: spotId,
      name: sanitizeInput(body.name),
      address: sanitizeInput(body.address || ''),
      memo: sanitizeInput(body.memo || ''),
      type: body.type,
      lat: body.lat,
      lng: body.lng,
      hasRoof: Boolean(body.hasRoof),
      hasChair: Boolean(body.hasChair),
      isEnclosed: Boolean(body.isEnclosed),
      is24Hours: Boolean(body.is24Hours),
      photos: body.photos, // S3 URLs
      source: 'user',
      status: 'pending', // pending, approved, rejected
      submittedBy: userId,
      submitterEmail: userEmail,
      submittedAt: timestamp,
      updatedAt: timestamp
    };

    // Save to pending table
    await docClient.send(new PutCommand({
      TableName: PENDING_TABLE,
      Item: pendingSpot
    }));

    // Send email notification to developer
    if (DEVELOPER_EMAIL) {
      const emailParams = {
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [DEVELOPER_EMAIL]
        },
        Message: {
          Subject: {
            Data: `[SmokeSpot] 새로운 장소 등록 신청: ${pendingSpot.name}`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: `
                <h2>새로운 흡연구역 등록 신청</h2>
                <table border="1" cellpadding="10" style="border-collapse: collapse;">
                  <tr><td><strong>이름</strong></td><td>${pendingSpot.name}</td></tr>
                  <tr><td><strong>주소</strong></td><td>${pendingSpot.address || '-'}</td></tr>
                  <tr><td><strong>유형</strong></td><td>${pendingSpot.type === 'allowed' ? '흡연구역' : '금연구역'}</td></tr>
                  <tr><td><strong>위치</strong></td><td>${pendingSpot.lat}, ${pendingSpot.lng}</td></tr>
                  <tr><td><strong>지붕</strong></td><td>${pendingSpot.hasRoof ? 'O' : 'X'}</td></tr>
                  <tr><td><strong>의자</strong></td><td>${pendingSpot.hasChair ? 'O' : 'X'}</td></tr>
                  <tr><td><strong>실내</strong></td><td>${pendingSpot.isEnclosed ? 'O' : 'X'}</td></tr>
                  <tr><td><strong>24시간</strong></td><td>${pendingSpot.is24Hours ? 'O' : 'X'}</td></tr>
                  <tr><td><strong>메모</strong></td><td>${pendingSpot.memo || '-'}</td></tr>
                  <tr><td><strong>사진 수</strong></td><td>${pendingSpot.photos.length}장</td></tr>
                  <tr><td><strong>신청자</strong></td><td>${userEmail || 'Anonymous'}</td></tr>
                  <tr><td><strong>신청일시</strong></td><td>${timestamp}</td></tr>
                </table>
                <p>
                  <a href="https://www.google.com/maps?q=${pendingSpot.lat},${pendingSpot.lng}" target="_blank">
                    Google Maps에서 위치 확인
                  </a>
                </p>
                <p>
                  <a href="${process.env.ADMIN_URL || '#'}/admin/review/${spotId}">
                    관리자 페이지에서 승인/거부
                  </a>
                </p>
              `,
              Charset: 'UTF-8'
            },
            Text: {
              Data: `
새로운 흡연구역 등록 신청

이름: ${pendingSpot.name}
주소: ${pendingSpot.address || '-'}
유형: ${pendingSpot.type === 'allowed' ? '흡연구역' : '금연구역'}
위치: ${pendingSpot.lat}, ${pendingSpot.lng}
신청자: ${userEmail || 'Anonymous'}
신청일시: ${timestamp}

Google Maps: https://www.google.com/maps?q=${pendingSpot.lat},${pendingSpot.lng}
              `,
              Charset: 'UTF-8'
            }
          }
        }
      };

      try {
        await sesClient.send(new SendEmailCommand(emailParams));
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: '장소 등록 신청이 완료되었습니다. 검토 후 승인됩니다.',
        spotId
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
