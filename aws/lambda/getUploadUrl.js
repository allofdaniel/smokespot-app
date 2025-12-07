/**
 * Lambda function for generating presigned S3 URLs for photo uploads
 * Returns a presigned URL that allows direct upload to S3
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({});

const BUCKET_NAME = process.env.BUCKET_NAME || 'smokespot-photos';
const URL_EXPIRATION = parseInt(process.env.URL_EXPIRATION) || 300; // 5 minutes

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    const { contentType, fileName } = body;

    // Validate content type
    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid content type',
          message: `Allowed types: ${ALLOWED_TYPES.join(', ')}`
        })
      };
    }

    // Get user ID from Cognito (if authenticated)
    const userId = event.requestContext?.authorizer?.claims?.sub || 'anonymous';

    // Generate unique file key
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const key = `uploads/${userId}/${timestamp}-${uniqueId}.${fileExtension}`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // Add metadata
      Metadata: {
        'uploaded-by': userId,
        'original-name': fileName || 'unknown'
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: URL_EXPIRATION
    });

    // The public URL where the image will be accessible
    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        key,
        publicUrl,
        expiresIn: URL_EXPIRATION
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
