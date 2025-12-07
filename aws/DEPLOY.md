# SmokeSpot AWS 배포 가이드

## 사전 요구사항

1. AWS 계정 (프리티어 사용 가능)
2. AWS CLI 설치 및 구성
3. AWS SAM CLI 설치
4. Node.js 18.x 이상

## 1. AWS SAM CLI 설치

```bash
# Windows (chocolatey)
choco install aws-sam-cli

# Mac
brew install aws-sam-cli

# 설치 확인
sam --version
```

## 2. AWS 자격증명 구성

```bash
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region name: ap-northeast-2
# Default output format: json
```

## 3. SES 이메일 인증

개발자 이메일로 알림을 받으려면 SES에서 이메일을 인증해야 합니다:

```bash
aws ses verify-email-identity --email-address your-email@example.com
```

인증 이메일이 발송됩니다. 링크를 클릭해서 인증을 완료하세요.

## 4. SSM Parameter Store에 시크릿 저장

소셜 로그인을 위한 API 키를 저장합니다:

```bash
# Google OAuth
aws ssm put-parameter \
  --name "/smokespot/google-client-id" \
  --value "YOUR_GOOGLE_CLIENT_ID" \
  --type SecureString

aws ssm put-parameter \
  --name "/smokespot/google-client-secret" \
  --value "YOUR_GOOGLE_CLIENT_SECRET" \
  --type SecureString
```

## 5. SAM 배포

```bash
cd aws

# Lambda 함수 의존성 설치
cd lambda
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-ses @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
cd ..

# SAM 빌드
sam build

# SAM 배포 (처음 배포시)
sam deploy --guided

# 설정 예시:
# Stack Name: smokespot-backend
# AWS Region: ap-northeast-2
# Parameter Environment: prod
# Parameter DeveloperEmail: your-email@example.com
# Parameter SenderEmail: noreply@smokespot.app (SES 인증 필요)
# Confirm changes before deploy: y
# Allow SAM CLI IAM role creation: Y
# Disable rollback: N
# Save arguments to configuration file: Y
```

## 6. 배포 결과 확인

배포가 완료되면 다음 출력값을 확인합니다:

- **ApiUrl**: API Gateway 엔드포인트
- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito 클라이언트 ID
- **UserPoolDomain**: Cognito 도메인
- **PhotosBucketName**: S3 버킷 이름

## 7. 프론트엔드 환경변수 설정

`.env.local` 파일을 생성하고 배포 결과값을 입력합니다:

```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-northeast-2.amazonaws.com/prod
VITE_AWS_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=smokespot-auth-prod-123456789.auth.ap-northeast-2.amazoncognito.com
```

## 8. 소셜 로그인 설정

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
2. OAuth 동의 화면 설정
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI 추가:
   - `https://your-cognito-domain/oauth2/idpresponse`

### Kakao 로그인

1. [Kakao Developers](https://developers.kakao.com)에서 앱 생성
2. 카카오 로그인 활성화
3. Redirect URI 설정:
   - `https://your-cognito-domain/oauth2/idpresponse`

### Naver 로그인

1. [Naver Developers](https://developers.naver.com)에서 앱 생성
2. 네아로 서비스 등록
3. Callback URL 설정:
   - `https://your-cognito-domain/oauth2/idpresponse`

## 9. 비용 추정 (프리티어 기준)

| 서비스 | 무료 한도 | 예상 비용 |
|--------|-----------|-----------|
| Lambda | 100만 요청/월 | $0 |
| API Gateway | 100만 요청/월 | $0 |
| DynamoDB | 25GB 스토리지 | $0 |
| S3 | 5GB 스토리지 | $0 |
| Cognito | 50,000 MAU | $0 |
| SES | 62,000 이메일/월 | $0 |

**예상 월 비용: $0 (프리티어 범위 내)**

## 10. 문제 해결

### Lambda 함수 로그 확인

```bash
sam logs -n smokespot-submit-spot-prod --tail
```

### API 테스트

```bash
# 장소 조회
curl https://your-api-url/prod/spots

# 장소 등록 (인증 필요)
curl -X POST https://your-api-url/prod/spots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"테스트","lat":37.5665,"lng":126.978,"type":"allowed","photos":["url"]}'
```

## 11. 업데이트 배포

코드 수정 후 재배포:

```bash
sam build && sam deploy
```

## 12. 스택 삭제

모든 리소스를 삭제하려면:

```bash
sam delete --stack-name smokespot-backend
```

**주의**: S3 버킷에 파일이 있으면 먼저 비워야 합니다.
