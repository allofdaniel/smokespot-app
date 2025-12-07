import type { SmokingSpot, SpotType, LocalizedText } from '../types'
import { translateJapaneseWithRegions, containsJapanese, detectLanguage } from '../utils/translations'

// CSV 데이터를 SmokingSpot 형식으로 변환
interface RawSpotData {
  coordinate_id?: string
  Id?: string
  name?: string
  Name?: string
  lat?: string
  Lat?: string
  lng?: string
  Lng?: string
  address?: string
  Address?: string
  memo?: string
  Memo?: string
  business_hour?: string
  'Business Hour'?: string
  holiday?: string
  Holiday?: string
  web_page?: string
  'Web Page'?: string
  roof?: string
  Roof?: string
  chair?: string
  Chair?: string
  enclosure?: string
  Enclosure?: string
  is_24_hours?: string
  'Is 24 Hours'?: string
  site_photos?: string
  'Site Photos'?: string
  created_time?: string
  'Created Time'?: string
  updated_time?: string
  'Updated Time'?: string
}

/**
 * 다국어 텍스트 생성
 */
function createLocalizedText(text: string): LocalizedText | undefined {
  if (!text) return undefined

  const lang = detectLanguage(text)

  if (lang === 'ja' && containsJapanese(text)) {
    const { ko, en } = translateJapaneseWithRegions(text)
    return {
      original: text,
      ko,
      en,
      originalLang: 'ja'
    }
  }

  if (lang === 'ko') {
    return {
      original: text,
      ko: text,
      originalLang: 'ko'
    }
  }

  if (lang === 'en') {
    return {
      original: text,
      en: text,
      originalLang: 'en'
    }
  }

  return {
    original: text,
    originalLang: lang as 'ja' | 'ko' | 'en' | 'zh'
  }
}

export function convertRawToSpot(raw: RawSpotData, source: SmokingSpot['source']): SmokingSpot | null {
  const lat = parseFloat(raw.lat || raw.Lat || '0')
  const lng = parseFloat(raw.lng || raw.Lng || '0')

  if (lat === 0 || lng === 0) return null

  const id = raw.coordinate_id || raw.Id || `${source}_${Math.random().toString(36).substr(2, 9)}`
  const name = raw.name || raw.Name || '이름 없음'
  const address = raw.address || raw.Address || ''
  const memo = raw.memo || raw.Memo || ''

  const photosStr = raw.site_photos || raw['Site Photos'] || ''
  const photos = photosStr ? photosStr.split(' | ').filter(p => p.trim()) : []

  return {
    id,
    name,
    nameLocalized: createLocalizedText(name),
    lat,
    lng,
    type: 'allowed' as SpotType,
    address,
    addressLocalized: createLocalizedText(address),
    memo,
    memoLocalized: createLocalizedText(memo),
    businessHour: raw.business_hour || raw['Business Hour'] || '',
    holiday: raw.holiday || raw.Holiday || '',
    webPage: raw.web_page || raw['Web Page'] || '',
    hasRoof: raw.roof === '1' || raw.Roof === '1',
    hasChair: raw.chair === '1' || raw.Chair === '1',
    isEnclosed: raw.enclosure === '1' || raw.Enclosure === '1',
    is24Hours: raw.is_24_hours === '1' || raw['Is 24 Hours'] === '1',
    photos: photos.length > 0 ? photos : undefined,
    source,
    country: 'JP', // kitsuenjo 데이터는 일본
    createdAt: raw.created_time || raw['Created Time'],
    updatedAt: raw.updated_time || raw['Updated Time']
  }
}

// 로컬 JSON 데이터 로드
export async function loadLocalData(): Promise<SmokingSpot[]> {
  try {
    const response = await fetch('/data/spots.json')
    if (!response.ok) {
      throw new Error('Failed to load local data')
    }
    const data = await response.json()

    // 새로운 통합 JSON 형식 지원
    let spots: any[]
    if (data.spots && Array.isArray(data.spots)) {
      // 새로운 형식: { version, spots: [...] }
      spots = data.spots
      console.log(`[SmokeSpot] JSON v${data.version}: ${data.totalSpots}개 스팟, ${data.spotsWithPhotos}개 사진 있음`)
    } else if (Array.isArray(data)) {
      // 기존 형식: [...]
      spots = data
    } else {
      throw new Error('Invalid data format')
    }

    // 다국어 처리 추가
    return spots.map(spot => ({
      ...spot,
      type: (spot.type || 'allowed') as SmokingSpot['type'],
      nameLocalized: spot.nameLocalized || createLocalizedText(spot.name),
      addressLocalized: spot.addressLocalized || createLocalizedText(spot.address || ''),
      country: spot.country || (spot.source === 'worldwide' ? 'WW' : 'JP'),
      source: spot.source || 'kitsuenjo'
    }))
  } catch (error) {
    console.error('Error loading local data:', error)
    return []
  }
}

// ============================================
// 한국 공공데이터 API 설정
// ============================================

interface KoreanApiConfig {
  id: string
  name: string
  region: string
  district: string
  type: SpotType
  endpoint: string
  parser: (data: unknown) => Array<{
    id?: string
    name: string
    lat: number
    lng: number
    address?: string
    memo?: string
  }>
}

// 전국 금연구역 표준데이터 API
export async function loadNationwideNoSmokingData(apiKey: string): Promise<SmokingSpot[]> {
  const spots: SmokingSpot[] = []
  const baseUrl = 'http://api.data.go.kr/openapi/tn_pubr_public_prhsmk_zn_api'

  try {
    let pageNo = 1
    const numOfRows = 1000
    let hasMore = true

    while (hasMore && pageNo <= 20) {
      const url = `${baseUrl}?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`

      const response = await fetch(url)
      if (!response.ok) {
        console.warn(`[전국금연구역] API returned ${response.status}`)
        break
      }

      const data = await response.json()
      const items = data?.response?.body?.items || []

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false
        break
      }

      for (const item of items) {
        const lat = parseFloat(item.latitude || item.la || '0')
        const lng = parseFloat(item.longitude || item.lo || '0')

        if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
          const name = item.prhsmkZoneNm || item.nm || '금연구역'
          const address = item.rdnmadr || item.lnmadr || ''

          spots.push({
            id: `nationwide_nosmoking_${pageNo}_${spots.length}`,
            name,
            nameLocalized: { original: name, ko: name, originalLang: 'ko' },
            lat,
            lng,
            type: 'forbidden',
            address,
            addressLocalized: { original: address, ko: address, originalLang: 'ko' },
            memo: item.prhsmkZoneAr ? `면적: ${item.prhsmkZoneAr}㎡` : '',
            source: 'public_api',
            country: 'KR',
            region: item.ctprvnNm || '',
            district: item.signguNm || ''
          })
        }
      }

      console.log(`[전국금연구역] 페이지 ${pageNo}: ${items.length}건`)
      pageNo++

      if (items.length < numOfRows) hasMore = false
    }
  } catch (error) {
    console.error('[전국금연구역] 오류:', error)
  }

  return spots
}

// 세종시 금연구역 API
export async function loadSejongNoSmokingData(apiKey: string): Promise<SmokingSpot[]> {
  const spots: SmokingSpot[] = []
  const baseUrl = 'http://apis.data.go.kr/5690000/sjNoSomking/sj_00000190'

  try {
    let pageIndex = 1
    const pageUnit = 100
    let hasMore = true

    while (hasMore && pageIndex <= 10) {
      const url = `${baseUrl}?serviceKey=${apiKey}&pageIndex=${pageIndex}&pageUnit=${pageUnit}&dataTy=json`

      const response = await fetch(url)
      if (!response.ok) break

      const data = await response.json()
      const items = data?.body || data?.items || []

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false
        break
      }

      for (const item of items) {
        const lat = parseFloat(item.la || '0')
        const lng = parseFloat(item.lo || '0')

        if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
          const name = item.nm || '세종시 금연구역'

          spots.push({
            id: `sejong_nosmoking_${pageIndex}_${spots.length}`,
            name,
            nameLocalized: { original: name, ko: name, originalLang: 'ko' },
            lat,
            lng,
            type: 'forbidden',
            address: item.scope || '',
            memo: item.vltnFfnlg ? `과태료: ${item.vltnFfnlg}` : '',
            source: 'public_api',
            country: 'KR',
            region: '세종특별자치시',
            district: ''
          })
        }
      }

      console.log(`[세종시 금연구역] 페이지 ${pageIndex}: ${items.length}건`)
      pageIndex++

      if (items.length < pageUnit) hasMore = false
    }
  } catch (error) {
    console.error('[세종시 금연구역] 오류:', error)
  }

  return spots
}

// 서울시 구별 흡연구역 API 목록
const seoulDistrictApis: KoreanApiConfig[] = [
  // 송파구 실외흡연구역
  {
    id: '15090343',
    name: '서울특별시 송파구 실외흡연구역',
    region: '서울특별시',
    district: '송파구',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15090343/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['건물명'] || '송파구 흡연구역',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['도로명주소'] || ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  },
  // 중구 흡연구역
  {
    id: '15080296',
    name: '서울특별시 중구 흡연구역',
    region: '서울특별시',
    district: '중구',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15080296/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['설치위치'] || '중구 흡연구역',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['설치도로명주소'] || '',
        memo: item['규모'] ? `규모: ${item['규모']}` : ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  },
  // 광진구 흡연구역
  {
    id: '15097874',
    name: '서울특별시 광진구 흡연구역',
    region: '서울특별시',
    district: '광진구',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15097874/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['흡연구역명'] || '광진구 흡연구역',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['소재지'] || item['도로명주소'] || '',
        memo: item['면적'] ? `면적: ${item['면적']}㎡` : ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  },
  // 마포구 흡연시설
  {
    id: '15068847',
    name: '서울특별시 마포구 흡연시설',
    region: '서울특별시',
    district: '마포구',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15068847/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['상호명'] || '마포구 흡연시설',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['소재지도로명주소'] || '',
        memo: item['흡연시설형태'] || ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  }
]

// 경기도 흡연구역 API 목록
const gyeonggiApis: KoreanApiConfig[] = [
  // 안양시 흡연구역
  {
    id: '15060926',
    name: '경기도 안양시 흡연구역',
    region: '경기도',
    district: '안양시',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15060926/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['흡연구역명'] || '안양시 흡연구역',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['소재지도로명주소'] || item['소재지지번주소'] || ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  }
]

// 부산시 흡연구역 API 목록
const busanApis: KoreanApiConfig[] = [
  // 연제구 흡연실
  {
    id: '15029124',
    name: '부산광역시 연제구 흡연실',
    region: '부산광역시',
    district: '연제구',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15029124/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['시설명'] || '연제구 흡연실',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['주소'] || item['도로명주소'] || ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  }
]

// 인천시 흡연구역 API 목록
const incheonApis: KoreanApiConfig[] = [
  // 서구 흡연구역
  {
    id: '15029136',
    name: '인천광역시 서구 흡연구역',
    region: '인천광역시',
    district: '서구',
    type: 'allowed',
    endpoint: 'https://api.odcloud.kr/api/15029136/v1/uddi:data',
    parser: (data: any) => {
      const items = data?.data || []
      return items.map((item: any) => ({
        name: item['흡연구역명'] || item['시설명'] || '서구 흡연구역',
        lat: parseFloat(item['위도'] || '0'),
        lng: parseFloat(item['경도'] || '0'),
        address: item['도로명주소'] || item['주소'] || ''
      })).filter((i: any) => i.lat !== 0 && i.lng !== 0)
    }
  }
]

// 모든 지자체 API 통합
const allKoreanApis: KoreanApiConfig[] = [
  ...seoulDistrictApis,
  ...gyeonggiApis,
  ...busanApis,
  ...incheonApis
]

// 지자체별 API 데이터 로드
async function loadKoreanDistrictApi(api: KoreanApiConfig, apiKey: string): Promise<SmokingSpot[]> {
  const spots: SmokingSpot[] = []

  try {
    const url = `${api.endpoint}?page=1&perPage=1000&serviceKey=${apiKey}`
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`[${api.name}] API returned ${response.status}`)
      return spots
    }

    const data = await response.json()
    const parsedItems = api.parser(data)

    for (const item of parsedItems) {
      spots.push({
        id: `kr_${api.district}_${spots.length}_${Math.random().toString(36).substr(2, 5)}`,
        name: item.name,
        nameLocalized: { original: item.name, ko: item.name, originalLang: 'ko' },
        lat: item.lat,
        lng: item.lng,
        type: api.type,
        address: item.address || '',
        addressLocalized: item.address
          ? { original: item.address, ko: item.address, originalLang: 'ko' }
          : undefined,
        memo: item.memo || '',
        source: 'public_api',
        country: 'KR',
        region: api.region,
        district: api.district
      })
    }

    console.log(`[${api.name}] ${spots.length}건 로드`)
  } catch (error) {
    console.error(`[${api.name}] 오류:`, error)
  }

  return spots
}

// 세종시 흡연구역 API (기존)
export async function loadSejongData(apiKey: string): Promise<SmokingSpot[]> {
  const spots: SmokingSpot[] = []

  try {
    const smokingUrl = `https://apis.data.go.kr/3610000/SmokingAreaInfoService/getSmokingAreaList?serviceKey=${apiKey}&numOfRows=1000&pageNo=1&type=json`
    const smokingRes = await fetch(smokingUrl)

    if (smokingRes.ok) {
      const data = await smokingRes.json()
      const items = data.response?.body?.items?.item || []

      for (const item of items) {
        const lat = parseFloat(item.latitude || '0')
        const lng = parseFloat(item.longitude || '0')

        if (lat !== 0 && lng !== 0) {
          const name = item.smokingAreaNm || '세종시 흡연구역'

          spots.push({
            id: `sejong_smoking_${item.smokingAreaNo || spots.length}`,
            name,
            nameLocalized: { original: name, ko: name, originalLang: 'ko' },
            lat,
            lng,
            type: 'allowed',
            address: item.roadNmAddr || item.lotnoAddr || '',
            source: 'public_api',
            country: 'KR',
            region: '세종특별자치시'
          })
        }
      }

      console.log(`[세종시 흡연구역] ${spots.length}건 로드`)
    }
  } catch (error) {
    console.error('[세종시 흡연구역] 오류:', error)
  }

  return spots
}

// ============================================
// 모든 데이터 통합 로드
// ============================================

export async function loadAllData(publicApiKey?: string): Promise<SmokingSpot[]> {
  const allSpots: SmokingSpot[] = []
  const seenIds = new Set<string>()
  const seenCoordinates = new Set<string>()

  // 중복 확인 함수 (좌표 기반, 소수점 5자리까지)
  const addSpot = (spot: SmokingSpot) => {
    if (!spot.lat || !spot.lng || isNaN(spot.lat) || isNaN(spot.lng)) return

    const coordKey = `${spot.lat.toFixed(5)}_${spot.lng.toFixed(5)}`
    if (!seenIds.has(spot.id) && !seenCoordinates.has(coordKey)) {
      allSpots.push(spot)
      seenIds.add(spot.id)
      seenCoordinates.add(coordKey)
    }
  }

  // 1. 로컬 데이터 로드 (kitsuenjo 일본 데이터)
  console.log('[SmokeSpot] 로컬 데이터 로드 중...')
  const localData = await loadLocalData()
  localData.forEach(addSpot)
  console.log(`[SmokeSpot] 로컬 데이터: ${localData.length}건`)

  // 2. 한국 공공데이터 API 로드
  if (publicApiKey && publicApiKey !== 'your_api_key_here') {
    console.log('[SmokeSpot] 한국 공공데이터 API 로드 중...')

    // 병렬 API 호출
    const apiPromises = [
      // 전국 금연구역 표준데이터
      loadNationwideNoSmokingData(publicApiKey).catch(e => {
        console.warn('[전국금연구역] 오류:', e.message)
        return [] as SmokingSpot[]
      }),

      // 세종시 금연구역
      loadSejongNoSmokingData(publicApiKey).catch(e => {
        console.warn('[세종시 금연구역] 오류:', e.message)
        return [] as SmokingSpot[]
      }),

      // 세종시 흡연구역
      loadSejongData(publicApiKey).catch(e => {
        console.warn('[세종시 흡연구역] 오류:', e.message)
        return [] as SmokingSpot[]
      }),

      // 지자체별 API 호출
      ...allKoreanApis.map(api =>
        loadKoreanDistrictApi(api, publicApiKey).catch(e => {
          console.warn(`[${api.name}] 오류:`, e.message)
          return [] as SmokingSpot[]
        })
      )
    ]

    const results = await Promise.all(apiPromises)

    let apiTotal = 0
    for (const spots of results) {
      spots.forEach(addSpot)
      apiTotal += spots.length
    }

    console.log(`[SmokeSpot] 한국 공공데이터: ${apiTotal}건`)
  } else {
    console.log('[SmokeSpot] API 키가 없어 공공데이터를 로드하지 않습니다.')
  }

  console.log(`[SmokeSpot] 총 ${allSpots.length}개 지점 로드 완료`)
  return allSpots
}

// 지역별 데이터 필터링 유틸리티
export function filterSpotsByCountry(spots: SmokingSpot[], country: 'JP' | 'KR' | 'US' | 'CN'): SmokingSpot[] {
  return spots.filter(spot => spot.country === country)
}

export function filterSpotsByRegion(spots: SmokingSpot[], region: string): SmokingSpot[] {
  return spots.filter(spot => spot.region === region)
}

export function filterSpotsByDistrict(spots: SmokingSpot[], district: string): SmokingSpot[] {
  return spots.filter(spot => spot.district === district)
}

// 통계 정보 생성
export function getSpotStatistics(spots: SmokingSpot[]) {
  const byCountry: Record<string, number> = {}
  const byRegion: Record<string, number> = {}
  const byType: Record<string, number> = {}

  for (const spot of spots) {
    const country = spot.country || 'unknown'
    byCountry[country] = (byCountry[country] || 0) + 1

    const region = spot.region || 'unknown'
    byRegion[region] = (byRegion[region] || 0) + 1

    byType[spot.type] = (byType[spot.type] || 0) + 1
  }

  return { byCountry, byRegion, byType, total: spots.length }
}
