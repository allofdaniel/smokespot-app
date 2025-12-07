# SmokeSpot 빌드 및 배포 가이드

## 개발 환경 요구사항

- Node.js 18+
- npm 또는 pnpm
- Android Studio (Android SDK 포함)
- Java 17+ (Android 빌드용)

## 프로젝트 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env

# 공공데이터포털 API 키 설정
# https://www.data.go.kr 에서 발급받은 키 입력
VITE_PUBLIC_DATA_API_KEY=your_actual_api_key
```

## 개발 모드 실행

```bash
# 웹 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

## 웹 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## Android 빌드

### 1. 웹 빌드 후 Capacitor 동기화

```bash
npm run build
npx cap sync android
```

### 2. Android Studio에서 열기

```bash
npx cap open android
```

### 3. 개발용 APK 빌드

Android Studio에서:
1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. APK 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. 릴리즈 AAB 빌드 (Play Store용)

#### 키스토어 생성 (최초 1회)

```bash
cd android
keytool -genkey -v -keystore smokespot-release.keystore -alias smokespot -keyalg RSA -keysize 2048 -validity 10000
```

프롬프트에 따라 비밀번호와 정보 입력

#### 서명 설정

```bash
# keystore.properties.example을 keystore.properties로 복사
cp keystore.properties.example keystore.properties

# 실제 비밀번호 입력
# storeFile=smokespot-release.keystore
# storePassword=입력한_비밀번호
# keyAlias=smokespot
# keyPassword=입력한_비밀번호
```

#### AAB 빌드

Android Studio에서:
1. Build > Generate Signed Bundle / APK
2. Android App Bundle 선택
3. 키스토어 정보 입력
4. release 빌드 타입 선택
5. AAB 위치: `android/app/build/outputs/bundle/release/app-release.aab`

또는 명령줄에서:

```bash
cd android
./gradlew bundleRelease
```

## Play Store 등록

### 1. 필요 자료

- [ ] 앱 아이콘 512x512 PNG (`store-assets/icon.svg` 기반으로 생성)
- [ ] 피처 그래픽 1024x500 PNG
- [ ] 스크린샷 (최소 2개, 권장 8개)
- [ ] 개인정보 처리방침 URL
- [ ] 릴리즈 AAB 파일

### 2. 스크린샷 캡처

1. Android Emulator에서 앱 실행
2. 주요 화면 스크린샷 캡처:
   - 메인 지도 화면
   - 흡연구역 상세 정보
   - 즐겨찾기 패널
   - 필터 패널
   - 검색 결과
   - 지점 등록 화면

### 3. Play Console 설정

1. [Play Console](https://play.google.com/console) 접속
2. 앱 만들기 > 세부정보 입력
3. 스토어 등록 정보 작성 (`store-assets/STORE_LISTING.md` 참조)
4. 개인정보처리방침 URL 등록
5. 앱 콘텐츠 설정 (연령 등급, 광고 등)
6. AAB 업로드

### 4. 출시

1. 프로덕션 트랙에 AAB 업로드
2. 출시 노트 작성
3. 심사 제출

## 문제 해결

### Gradle 빌드 오류

```bash
cd android
./gradlew clean
./gradlew build
```

### Capacitor 동기화 오류

```bash
npx cap sync android --force
```

### 서명 오류

keystore.properties 파일의 경로와 비밀번호 확인

## 버전 관리

버전 업데이트 시 수정해야 할 파일:
1. `android/app/build.gradle` - versionCode, versionName
2. `package.json` - version
3. `.env.example` - VITE_APP_VERSION

## 추가 리소스

- [Capacitor 문서](https://capacitorjs.com/docs)
- [Play Console 도움말](https://support.google.com/googleplay/android-developer)
- [공공데이터포털](https://www.data.go.kr)
