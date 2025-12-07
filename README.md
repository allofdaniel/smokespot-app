# SmokeSpot - 흡연구역 지도 앱

![SmokeSpot](https://img.shields.io/badge/SmokeSpot-v1.0.0-22D3EE?style=for-the-badge&logo=smoking&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=flat-square&logo=typescript)
![Capacitor](https://img.shields.io/badge/Capacitor-5.5.1-119EFF?style=flat-square&logo=capacitor)

글라스모피즘 디자인의 세련된 흡연구역 찾기 앱입니다. 전 세계 66,000개 이상의 흡연구역 정보를 제공합니다.

## Preview

<div align="center">
  <img src="docs/preview-map.png" alt="Map View" width="300"/>
  <img src="docs/preview-detail.png" alt="Detail View" width="300"/>
</div>

## Features

### Core Features
- **지도 기반 탐색**: Leaflet 기반의 인터랙티브 지도
- **실시간 위치**: GPS 기반 현재 위치 추적
- **필터링**: 흡연구역/금연구역/사용자 등록 장소 필터
- **상세 정보**: 시설 정보 (지붕, 의자, 실내 여부, 24시간)
- **사진 갤러리**: 장소별 사진 확인

### User Features
- **장소 등록**: 새로운 흡연구역 직접 등록
- **사진 업로드**: 장소 사진 첨부
- **길찾기**: Google Maps 연동 네비게이션
- **공유**: 장소 정보 공유

### UI/UX
- **글라스모피즘 디자인**: 투명 유리 효과의 세련된 UI
- **오로라 배경**: 애니메이션 그라데이션 배경
- **반응형 디자인**: 모바일/데스크탑 최적화
- **다크 테마**: 눈의 피로를 줄이는 다크 모드

## Tech Stack

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Framer Motion** - 애니메이션

### Map & Location
- **Leaflet** - 지도 라이브러리
- **React-Leaflet** - React 바인딩
- **CARTO** - 다크 테마 타일

### Mobile
- **Capacitor** - 네이티브 앱 빌드
- **@capacitor/geolocation** - GPS
- **@capacitor/camera** - 카메라

## Project Structure

```
smoking-area-app/
├── android/                    # Android 네이티브 프로젝트
├── src/
│   ├── components/
│   │   ├── AddSpotModal.tsx    # 장소 등록 모달
│   │   ├── FavoritesPanel.tsx  # 즐겨찾기 패널
│   │   ├── FilterPanel.tsx     # 필터 패널
│   │   ├── SearchBar.tsx       # 검색바
│   │   ├── SpotMarker.tsx      # 지도 마커 (React.memo 최적화)
│   │   └── SpotPopup.tsx       # 장소 상세 팝업
│   ├── hooks/
│   │   └── useFavorites.ts     # 즐겨찾기 커스텀 훅
│   ├── data/
│   │   ├── dataLoader.ts       # 데이터 로딩 유틸
│   │   └── sampleData.ts       # 샘플 데이터
│   ├── types/
│   │   └── index.ts            # TypeScript 타입 정의
│   ├── App.tsx                 # 메인 앱 컴포넌트
│   ├── main.tsx                # 앱 엔트리
│   └── index.css               # 글로벌 스타일
├── public/
│   ├── data/
│   │   └── spots.json          # 흡연구역 데이터
│   ├── icons/                  # PWA 아이콘
│   ├── manifest.json           # PWA 매니페스트
│   └── sw.js                   # Service Worker
├── capacitor.config.ts         # Capacitor 설정
├── tailwind.config.js          # Tailwind 설정
├── vite.config.ts              # Vite 설정
└── package.json
```

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Android Studio (Android 빌드용)

### Setup

```bash
# 저장소 클론
cd smoking-area-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Build

```bash
# 웹 빌드
npm run build

# Android 빌드
npm run android
```

## Data Sources

### 1. Kitsuenjo (喫煙所マップ)
- 일본 전역 66,000개+ 흡연구역 데이터
- 주소, 시설 정보, 운영시간, 사진 포함

### 2. 한국 공공데이터 API (data.go.kr)
- **전국금연구역표준데이터**: 전국 금연구역 통합 API
- **세종특별자치시 금연구역 조회**: 세종시 금연구역 정보
- **서울특별시 강남구 흡연구역**: 강남구 지정 흡연구역
- **부산광역시 흡연구역**: 부산 흡연구역 정보
- 기타 지자체 공공데이터

> API 키 발급: https://www.data.go.kr 회원가입 후 인증키 발급

### Data Schema

```typescript
interface SmokingSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'allowed' | 'forbidden' | 'user';
  address?: string;
  memo?: string;
  businessHour?: string;
  photos?: string[];
  hasRoof?: boolean;
  hasChair?: boolean;
  isEnclosed?: boolean;
  is24Hours?: boolean;
  source: 'kitsuenjo' | 'public_api' | 'user';
}
```

## Development Progress

### Completed
- [x] 프로젝트 구조 설계
- [x] 글라스모피즘 UI 구현
- [x] Leaflet 지도 컴포넌트
- [x] 커스텀 마커 디자인
- [x] 필터 패널 구현
- [x] 장소 상세 팝업
- [x] 사용자 장소 등록 기능
- [x] 검색 기능
- [x] 현재 위치 탐색
- [x] 데이터 통합 (66,232개)
- [x] Capacitor 설정
- [x] 즐겨찾기 기능 (localStorage 기반)
- [x] PWA 오프라인 지원 (Service Worker)
- [x] Android 앱 빌드 설정
- [x] 성능 최적화 (React.memo, 뷰포트 필터링)
- [x] 공공데이터포털 API 연동 (전국 금연구역, 세종시 등)
- [x] 마커 미리보기 팝업 (사진 포함)
- [x] 마커 아이콘 캐싱 최적화
- [x] Play Store 배포 준비 (아이콘, 개인정보처리방침, 서명 설정)

### Planned
- [ ] Google Play Store 출시
- [ ] iOS 앱 빌드
- [ ] 리뷰/평점 시스템
- [ ] 실시간 혼잡도
- [ ] 다국어 지원
- [ ] 마커 클러스터링

## Play Store 배포

### 빌드 가이드

자세한 빌드 및 배포 방법은 [BUILD_GUIDE.md](./BUILD_GUIDE.md)를 참조하세요.

### 필요 자료

| 자료 | 위치 | 설명 |
|------|------|------|
| 앱 아이콘 | `store-assets/icon.svg` | 512x512 PNG로 변환 필요 |
| 스토어 설명 | `store-assets/STORE_LISTING.md` | 앱 이름, 설명, 키워드 |
| 개인정보처리방침 | `PRIVACY_POLICY.md` | 한글/영문 버전 |
| 서명 설정 | `android/keystore.properties.example` | 릴리즈 서명 설정 |

### 빠른 시작

```bash
# 1. 환경 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 2. 빌드
npm run build
npx cap sync android

# 3. Android Studio에서 AAB 빌드
npx cap open android
# Build > Generate Signed Bundle / APK
```

## Color Scheme

```css
/* Aurora Colors */
--aurora-mint: #5EEAD4;
--aurora-purple: #C084FC;
--aurora-blue: #60A5FA;
--aurora-pink: #F472B6;

/* Status Colors */
--smoke-allowed: #22D3EE;   /* 흡연구역 - 시안 */
--smoke-forbidden: #F87171; /* 금연구역 - 레드 */
--smoke-user: #A78BFA;      /* 사용자 - 퍼플 */
```

## Performance

- **최대 500개 마커 렌더링**: 뷰포트 기반 필터링으로 성능 최적화
- **Lazy Loading**: 필요한 데이터만 로드
- **CSS 애니메이션**: GPU 가속 활용

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

Made with Glassmorphism UI Design
