// 흡연구역 타입 정의

export type SpotType = 'allowed' | 'forbidden' | 'user';

// 다국어 텍스트 인터페이스
export interface LocalizedText {
  original: string;      // 원본 (현지어)
  ko?: string;          // 한국어
  en?: string;          // 영어
  originalLang?: 'ja' | 'ko' | 'en' | 'zh';  // 원본 언어 코드
}

export interface SmokingSpot {
  id: string;
  name: string;
  // 다국어 이름 (선택적)
  nameLocalized?: LocalizedText;
  lat: number;
  lng: number;
  type: SpotType;
  address?: string;
  // 다국어 주소 (선택적)
  addressLocalized?: LocalizedText;
  memo?: string;
  // 다국어 메모 (선택적)
  memoLocalized?: LocalizedText;
  businessHour?: string;
  holiday?: string;
  webPage?: string;
  photos?: string[];
  hasRoof?: boolean;
  hasChair?: boolean;
  isEnclosed?: boolean;
  is24Hours?: boolean;
  source: 'kitsuenjo' | 'public_api' | 'user';
  // 국가/지역 코드
  country?: 'JP' | 'KR' | 'US' | 'CN';
  region?: string;  // 시/도
  district?: string; // 구/군
  createdAt?: string;
  updatedAt?: string;
}

export interface FilterState {
  showAllowed: boolean;
  showForbidden: boolean;
  showUserSpots: boolean;
  showWithPhotos: boolean;
  // 국가 필터 (null = 모두 표시)
  countryFilter: 'JP' | 'KR' | 'all';
}

// 언어 설정
export type DisplayLanguage = 'auto' | 'ko' | 'en' | 'original';

export interface AppSettings {
  displayLanguage: DisplayLanguage;
  theme: 'dark' | 'light' | 'auto';
}

export interface MapState {
  center: [number, number];
  zoom: number;
}

export interface AddSpotForm {
  name: string;
  address: string;
  memo: string;
  type: SpotType;
  hasRoof: boolean;
  hasChair: boolean;
  isEnclosed: boolean;
  is24Hours: boolean;
  photos: File[];
}
