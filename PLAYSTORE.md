# SmokeSpot - Google Play Store 출시 가이드

## 1. 사전 준비

### 필수 계정
- [x] Google Play Developer 계정 ($25 일회성 등록비)
- [x] Google AdMob 계정 (광고용)
- [ ] AWS 계정 (백엔드 배포용)

### 필수 문서
- [x] 개인정보처리방침 (`/privacy.html`)
- [x] 이용약관 (`/terms.html`)

## 2. 앱 빌드 준비

### 2.1 환경변수 설정

`.env.local` 파일 생성:
```env
VITE_API_URL=https://your-api.execute-api.ap-northeast-2.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_XXXXXXXX
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_DOMAIN=your-domain.auth.ap-northeast-2.amazoncognito.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_KAKAO_CLIENT_ID=your-kakao-client-id
VITE_NAVER_CLIENT_ID=your-naver-client-id
VITE_ADMOB_BANNER_ANDROID=ca-app-pub-XXXX/XXXXXXX
```

### 2.2 프로덕션 빌드

```bash
# 웹 빌드
npm run build

# Android 프로젝트 동기화
npx cap sync android
```

### 2.3 서명 키 생성

처음 한 번만 실행:
```bash
cd android
keytool -genkey -v -keystore release-key.keystore -alias smokespot -keyalg RSA -keysize 2048 -validity 10000
```

프롬프트에 정보 입력:
- keystore password: (안전하게 보관)
- key password: (안전하게 보관)
- 이름, 조직 등

**중요**: `release-key.keystore` 파일과 비밀번호를 안전하게 백업하세요!

### 2.4 Gradle 서명 설정

`android/app/build.gradle` 파일에 추가:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'smokespot'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2.5 릴리스 APK/AAB 빌드

```bash
cd android

# AAB 빌드 (Play Store 권장)
./gradlew bundleRelease

# APK 빌드 (테스트용)
./gradlew assembleRelease
```

빌드 결과물:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

## 3. Google Play Console 설정

### 3.1 앱 정보

| 항목 | 내용 |
|------|------|
| 앱 이름 | SmokeSpot - 흡연구역 지도 |
| 짧은 설명 | 주변 흡연구역을 쉽게 찾아주는 지도 앱 |
| 전체 설명 | (아래 참조) |
| 카테고리 | 지도 & 내비게이션 |
| 콘텐츠 등급 | 모든 연령 |

**전체 설명 예시:**
```
SmokeSpot은 전국 66,000개 이상의 흡연구역 정보를 제공하는 지도 앱입니다.

주요 기능:
• 주변 흡연구역 실시간 검색
• GPS 기반 가까운 흡연구역 안내
• 흡연구역/금연구역 구분 표시
• 지붕, 의자, 실내 여부 등 상세 정보
• 새로운 흡연구역 등록 신청
• 즐겨찾기 기능

공공데이터를 기반으로 정확한 정보를 제공하며, 사용자가 직접 새로운 장소를 등록할 수도 있습니다.

깔끔한 글라스모피즘 디자인으로 어두운 환경에서도 편리하게 사용할 수 있습니다.
```

### 3.2 스크린샷 준비

필수 스크린샷:
- 휴대전화: 최소 2장, 최대 8장 (1080 x 1920 권장)
- 태블릿: 선택사항

권장 스크린샷:
1. 지도 화면 (메인)
2. 검색 결과
3. 장소 상세 정보
4. 장소 등록 화면
5. 로그인 화면

### 3.3 개인정보처리방침 URL

Play Console에 입력할 URL:
```
https://your-domain.com/privacy.html
```

또는 GitHub Pages 사용:
```
https://your-username.github.io/smokespot/privacy.html
```

## 4. AdMob 설정

### 4.1 AdMob 앱 등록
1. AdMob 콘솔에서 새 앱 추가
2. Android 앱 선택
3. 앱 ID 확인 (ca-app-pub-XXXX~XXXXXXX)

### 4.2 광고 단위 생성
1. 배너 광고 단위 생성
2. 광고 단위 ID 복사 (ca-app-pub-XXXX/XXXXXXX)
3. `.env.local`에 추가

### 4.3 AndroidManifest.xml 수정

`android/app/src/main/AndroidManifest.xml`에 추가:
```xml
<application>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-XXXXXXXX~XXXXXXXXX"/>
</application>
```

## 5. 출시 체크리스트

### 필수 확인 사항
- [ ] 프로덕션 빌드 완료
- [ ] 서명 키 생성 및 백업
- [ ] AAB/APK 빌드 성공
- [ ] 앱 아이콘 설정 (모든 해상도)
- [ ] 스플래시 스크린 설정
- [ ] 개인정보처리방침 URL 등록
- [ ] 이용약관 URL 등록
- [ ] AdMob 앱 ID 설정
- [ ] 테스트 광고 -> 실제 광고 전환
- [ ] 권한 설명 추가 (위치, 카메라)

### 테스트 확인 사항
- [ ] 검색 기능 동작
- [ ] 현재 위치 기능 동작
- [ ] 카메라 촬영 동작
- [ ] 소셜 로그인 동작
- [ ] 장소 등록 동작
- [ ] 광고 표시 확인
- [ ] 오프라인 모드 확인

## 6. 출시 후 모니터링

### Google Play Console
- 설치 통계
- 충돌 보고서
- ANR (앱 응답 없음) 보고서
- 사용자 리뷰

### Firebase Crashlytics (선택)
실시간 충돌 모니터링을 위해 Firebase Crashlytics 연동 권장

## 7. 버전 업데이트

### 버전 올리기
`android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 2  // 매 업데이트마다 +1
        versionName "1.1.0"
    }
}
```

### 업데이트 빌드
```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

## 문제 해결

### 빌드 실패 시
```bash
cd android
./gradlew clean
./gradlew bundleRelease --stacktrace
```

### 서명 오류 시
- keystore 경로 확인
- 비밀번호 정확성 확인
- `keytool -list -keystore release-key.keystore`로 키 확인

### 권한 오류 시
`android/app/src/main/AndroidManifest.xml` 확인:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
```
