/**
 * CSV 데이터를 JSON으로 변환하는 스크립트
 * 수집된 흡연구역 데이터를 앱에서 사용할 수 있는 형식으로 변환
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// CSV 파싱 함수
function parseCSV(csvContent) {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  const data = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // CSV 파싱 (쉼표가 값 안에 있을 수 있음)
    const values = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    data.push(obj)
  }

  return data
}

// 데이터 변환
function convertToAppFormat(rawData, source) {
  return rawData.map((item, index) => {
    const lat = parseFloat(item.Lat || item.lat || 0)
    const lng = parseFloat(item.Lng || item.lng || 0)

    if (lat === 0 || lng === 0) return null

    const coordinateId = item['Coordinate Id'] || item.coordinate_id || item.Id || `${source}_${index}`

    return {
      id: coordinateId,
      name: item.Name || item.name || '이름 없음',
      lat,
      lng,
      type: 'allowed', // kitsuenjo 데이터는 모두 흡연구역
      address: item.Address || item.address || '',
      memo: item.Memo || item.memo || '',
      businessHour: item['Business Hour'] || item.business_hour || '',
      holiday: item.Holiday || item.holiday || '',
      webPage: item['Web Page'] || item.web_page || '',
      hasRoof: item.Roof === '1' || item.roof === '1',
      hasChair: item.Chair === '1' || item.chair === '1',
      isEnclosed: item.Enclosure === '1' || item.enclosure === '1',
      is24Hours: item['Is 24 Hours'] === '1' || item.is_24_hours === '1',
      photos: item['Site Photos'] ? item['Site Photos'].split(' | ').filter(p => p) : [],
      source,
      createdAt: item['Created Time'] || item.created_time || '',
      updatedAt: item['Updated Time'] || item.updated_time || ''
    }
  }).filter(item => item !== null)
}

async function main() {
  const dataDir = path.join(__dirname, '../../')
  const outputDir = path.join(__dirname, '../public/data')

  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const allSpots = []

  // 1. 일본/한국 데이터 변환
  const japanKoreaFile = path.join(dataDir, 'smoking_areas_full_db_parallel.csv')
  if (fs.existsSync(japanKoreaFile)) {
    console.log('📂 Loading Japan/Korea data...')
    const content = fs.readFileSync(japanKoreaFile, 'utf-8')
    const rawData = parseCSV(content)
    const converted = convertToAppFormat(rawData, 'kitsuenjo')
    allSpots.push(...converted)
    console.log(`   ✓ ${converted.length} spots loaded`)
  }

  // 2. 전세계 데이터 변환
  const worldwideFile = path.join(dataDir, 'smoking_areas_worldwide.csv')
  if (fs.existsSync(worldwideFile)) {
    console.log('📂 Loading worldwide data...')
    const content = fs.readFileSync(worldwideFile, 'utf-8')
    const rawData = parseCSV(content)
    const converted = convertToAppFormat(rawData, 'kitsuenjo')

    // 중복 제거 (ID 기준)
    const existingIds = new Set(allSpots.map(s => s.id))
    const newSpots = converted.filter(s => !existingIds.has(s.id))
    allSpots.push(...newSpots)
    console.log(`   ✓ ${newSpots.length} new spots added`)
  }

  // 3. JSON 파일로 저장
  const outputFile = path.join(outputDir, 'spots.json')
  fs.writeFileSync(outputFile, JSON.stringify(allSpots, null, 2), 'utf-8')

  console.log(`\n✅ Conversion complete!`)
  console.log(`   Total spots: ${allSpots.length}`)
  console.log(`   Output: ${outputFile}`)

  // 4. 통계 출력
  const stats = {
    total: allSpots.length,
    withPhotos: allSpots.filter(s => s.photos.length > 0).length,
    withAddress: allSpots.filter(s => s.address).length,
    is24Hours: allSpots.filter(s => s.is24Hours).length,
    hasRoof: allSpots.filter(s => s.hasRoof).length,
    hasChair: allSpots.filter(s => s.hasChair).length
  }

  console.log('\n📊 Statistics:')
  console.log(`   With photos: ${stats.withPhotos}`)
  console.log(`   With address: ${stats.withAddress}`)
  console.log(`   24 hours: ${stats.is24Hours}`)
  console.log(`   Has roof: ${stats.hasRoof}`)
  console.log(`   Has chair: ${stats.hasChair}`)
}

main().catch(console.error)
