import type { SmokingSpot } from '../types'

// Sample data - will be replaced with actual collected data
export const sampleData: SmokingSpot[] = [
  // 서울 - 흡연구역
  {
    id: '1',
    name: '강남역 2번 출구 흡연구역',
    lat: 37.4979,
    lng: 127.0276,
    type: 'allowed',
    address: '서울특별시 강남구 강남대로 396',
    memo: '지하철 2번 출구 옆, 조그마한 흡연부스',
    hasRoof: true,
    hasChair: false,
    isEnclosed: true,
    is24Hours: true,
    source: 'user',
    photos: ['sample1.jpg']
  },
  {
    id: '2',
    name: '서울역 KTX 대합실 흡연실',
    lat: 37.5547,
    lng: 126.9707,
    type: 'allowed',
    address: '서울특별시 용산구 한강대로 405',
    memo: 'KTX 대합실 내 흡연실, 환기 잘됨',
    hasRoof: true,
    hasChair: true,
    isEnclosed: true,
    is24Hours: false,
    businessHour: '05:30 - 24:00',
    source: 'public_api',
    photos: ['sample2.jpg', 'sample3.jpg']
  },
  {
    id: '3',
    name: '홍대입구역 흡연구역',
    lat: 37.5571,
    lng: 126.9246,
    type: 'allowed',
    address: '서울특별시 마포구 양화로 160',
    memo: '9번 출구 앞 지정 흡연구역',
    hasRoof: false,
    hasChair: false,
    isEnclosed: false,
    is24Hours: true,
    source: 'public_api'
  },
  // 서울 - 금연구역
  {
    id: '4',
    name: '광화문광장',
    lat: 37.5759,
    lng: 126.9769,
    type: 'forbidden',
    address: '서울특별시 종로구 세종대로 172',
    memo: '전 구역 금연, 과태료 10만원',
    source: 'public_api'
  },
  {
    id: '5',
    name: '명동거리 금연구역',
    lat: 37.5636,
    lng: 126.9850,
    type: 'forbidden',
    address: '서울특별시 중구 명동길',
    memo: '명동 전 지역 금연구역 지정',
    source: 'public_api'
  },
  // 부산
  {
    id: '6',
    name: '부산역 흡연구역',
    lat: 35.1152,
    lng: 129.0413,
    type: 'allowed',
    address: '부산광역시 동구 중앙대로 206',
    hasRoof: true,
    hasChair: true,
    isEnclosed: false,
    is24Hours: true,
    source: 'kitsuenjo',
    photos: ['busan1.jpg']
  },
  {
    id: '7',
    name: '해운대 해수욕장',
    lat: 35.1587,
    lng: 129.1604,
    type: 'forbidden',
    address: '부산광역시 해운대구 해운대해변로 264',
    memo: '해수욕장 전 구역 금연',
    source: 'public_api'
  },
  // 제주
  {
    id: '8',
    name: '제주공항 흡연실',
    lat: 33.5059,
    lng: 126.4929,
    type: 'allowed',
    address: '제주특별자치도 제주시 공항로 2',
    memo: '출국장 내 흡연실',
    hasRoof: true,
    hasChair: true,
    isEnclosed: true,
    is24Hours: false,
    businessHour: '06:00 - 22:00',
    source: 'kitsuenjo',
    photos: ['jeju1.jpg', 'jeju2.jpg']
  },
  // 일본 데이터 (kitsuenjo에서 수집)
  {
    id: 'jp_1',
    name: '渋谷駅 喫煙所',
    lat: 35.6580,
    lng: 139.7016,
    type: 'allowed',
    address: '東京都渋谷区道玄坂',
    memo: 'ハチ公前広場近く',
    hasRoof: true,
    hasChair: false,
    isEnclosed: true,
    is24Hours: true,
    source: 'kitsuenjo',
    photos: ['shibuya1.jpg']
  },
  {
    id: 'jp_2',
    name: '東京駅 八重洲口喫煙所',
    lat: 35.6812,
    lng: 139.7671,
    type: 'allowed',
    address: '東京都千代田区丸の内',
    memo: '八重洲口出てすぐ',
    hasRoof: true,
    hasChair: true,
    isEnclosed: false,
    is24Hours: true,
    source: 'kitsuenjo',
    photos: ['tokyo1.jpg', 'tokyo2.jpg']
  },
  {
    id: 'jp_3',
    name: '大阪駅 梅田口喫煙所',
    lat: 34.7024,
    lng: 135.4959,
    type: 'allowed',
    address: '大阪市北区梅田',
    memo: '駅構内の喫煙ブース',
    hasRoof: true,
    hasChair: true,
    isEnclosed: true,
    is24Hours: false,
    businessHour: '07:00 - 23:00',
    source: 'kitsuenjo'
  },
  // 더 많은 샘플 데이터...
  {
    id: '9',
    name: '잠실역 흡연구역',
    lat: 37.5133,
    lng: 127.1001,
    type: 'allowed',
    address: '서울특별시 송파구 올림픽로 지하 265',
    hasRoof: true,
    hasChair: false,
    isEnclosed: true,
    is24Hours: true,
    source: 'user'
  },
  {
    id: '10',
    name: '여의도공원 금연구역',
    lat: 37.5255,
    lng: 126.9234,
    type: 'forbidden',
    address: '서울특별시 영등포구 여의공원로 68',
    memo: '공원 전체 금연구역',
    source: 'public_api'
  },
  {
    id: '11',
    name: '인천공항 흡연실',
    lat: 37.4602,
    lng: 126.4407,
    type: 'allowed',
    address: '인천광역시 중구 공항로 272',
    memo: '출국장 A,B,C 구역에 각각 위치',
    hasRoof: true,
    hasChair: true,
    isEnclosed: true,
    is24Hours: false,
    businessHour: '05:00 - 23:00',
    source: 'public_api',
    photos: ['incheon1.jpg']
  },
  {
    id: '12',
    name: '판교역 흡연구역',
    lat: 37.3947,
    lng: 127.1109,
    type: 'allowed',
    address: '경기도 성남시 분당구 판교역로 160',
    hasRoof: true,
    hasChair: false,
    isEnclosed: false,
    is24Hours: true,
    source: 'user'
  }
]

// Function to load actual collected data from CSV
export async function loadCollectedData(): Promise<SmokingSpot[]> {
  try {
    // This would be replaced with actual API call or local data loading
    const response = await fetch('/api/spots')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to load collected data:', error)
    return sampleData
  }
}

// Function to load from public API
export async function loadPublicApiData(): Promise<SmokingSpot[]> {
  // 공공데이터 API 호출 구현
  // 서울시 광진구 흡연구역/금연구역 API 등
  return []
}
