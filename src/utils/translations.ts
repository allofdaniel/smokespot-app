/**
 * 일본어 흡연구역 관련 용어 번역 사전
 * 정확한 번역을 위해 일반적인 장소 유형과 시설명을 사전 정의
 */

// 일본어 -> 한국어/영어 번역 매핑
export const jaToKoEnMap: Record<string, { ko: string; en: string }> = {
  // 장소 유형
  '喫煙所': { ko: '흡연구역', en: 'Smoking Area' },
  '喫煙室': { ko: '흡연실', en: 'Smoking Room' },
  '喫煙スペース': { ko: '흡연 공간', en: 'Smoking Space' },
  '喫煙コーナー': { ko: '흡연 코너', en: 'Smoking Corner' },
  '灰皿': { ko: '재떨이', en: 'Ashtray' },
  '喫煙ブース': { ko: '흡연 부스', en: 'Smoking Booth' },
  '屋外喫煙所': { ko: '실외 흡연구역', en: 'Outdoor Smoking Area' },
  '屋内喫煙所': { ko: '실내 흡연구역', en: 'Indoor Smoking Area' },

  // 시설 유형
  '駅': { ko: '역', en: 'Station' },
  '空港': { ko: '공항', en: 'Airport' },
  '公園': { ko: '공원', en: 'Park' },
  'ビル': { ko: '빌딩', en: 'Building' },
  'デパート': { ko: '백화점', en: 'Department Store' },
  'ショッピングモール': { ko: '쇼핑몰', en: 'Shopping Mall' },
  'コンビニ': { ko: '편의점', en: 'Convenience Store' },
  'レストラン': { ko: '레스토랑', en: 'Restaurant' },
  '居酒屋': { ko: '이자카야', en: 'Izakaya (Japanese Bar)' },
  'カフェ': { ko: '카페', en: 'Cafe' },
  'ホテル': { ko: '호텔', en: 'Hotel' },
  '温泉': { ko: '온천', en: 'Hot Spring' },
  '病院': { ko: '병원', en: 'Hospital' },
  '図書館': { ko: '도서관', en: 'Library' },
  '市役所': { ko: '시청', en: 'City Hall' },
  '区役所': { ko: '구청', en: 'Ward Office' },
  '銀行': { ko: '은행', en: 'Bank' },
  '郵便局': { ko: '우체국', en: 'Post Office' },
  'ファミレス': { ko: '패밀리 레스토랑', en: 'Family Restaurant' },
  'パーキング': { ko: '주차장', en: 'Parking' },
  '入口': { ko: '입구', en: 'Entrance' },
  '出口': { ko: '출구', en: 'Exit' },
  '裏': { ko: '뒤편', en: 'Behind/Back' },
  '前': { ko: '앞', en: 'Front' },
  '横': { ko: '옆', en: 'Side' },
  '近く': { ko: '근처', en: 'Near' },

  // 일본 유명 시설/체인
  'セブンイレブン': { ko: '세븐일레븐', en: 'Seven-Eleven' },
  'ローソン': { ko: '로손', en: 'Lawson' },
  'ファミリーマート': { ko: '패밀리마트', en: 'FamilyMart' },
  'マクドナルド': { ko: '맥도날드', en: "McDonald's" },
  'スターバックス': { ko: '스타벅스', en: 'Starbucks' },
  'ドトール': { ko: '도토루 커피', en: 'Doutor Coffee' },
  'タリーズ': { ko: '탈리스 커피', en: "Tully's Coffee" },
  'イオン': { ko: '이온', en: 'AEON' },
  'ドンキホーテ': { ko: '돈키호테', en: 'Don Quijote' },
  'ビックカメラ': { ko: '빅카메라', en: 'Bic Camera' },
  'ヨドバシカメラ': { ko: '요도바시 카메라', en: 'Yodobashi Camera' },
  'ユニクロ': { ko: '유니클로', en: 'UNIQLO' },
  'ハウステンボス': { ko: '하우스텐보스', en: 'Huis Ten Bosch' },
  'ディズニー': { ko: '디즈니', en: 'Disney' },
  'USJ': { ko: 'USJ', en: 'Universal Studios Japan' },

  // 방향/위치
  '東': { ko: '동쪽', en: 'East' },
  '西': { ko: '서쪽', en: 'West' },
  '南': { ko: '남쪽', en: 'South' },
  '北': { ko: '북쪽', en: 'North' },
  '中央': { ko: '중앙', en: 'Central' },
  '階': { ko: '층', en: 'Floor' },
  '地下': { ko: '지하', en: 'Underground/Basement' },
  '屋上': { ko: '옥상', en: 'Rooftop' },

  // 일본 행정구역
  '都': { ko: '도', en: 'Metropolis' },
  '道': { ko: '도', en: 'Prefecture' },
  '府': { ko: '부', en: 'Urban Prefecture' },
  '県': { ko: '현', en: 'Prefecture' },
  '市': { ko: '시', en: 'City' },
  '区': { ko: '구', en: 'Ward' },
  '町': { ko: '정/마치', en: 'Town' },
  '村': { ko: '촌', en: 'Village' },
  '丁目': { ko: '쵸메', en: 'Block' },
  '番地': { ko: '번지', en: 'Lot Number' },
};

// 일본어 숫자
const jaNumbers: Record<string, string> = {
  '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
  '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
};

/**
 * 일본어 텍스트에서 알려진 용어를 번역
 */
export function translateJapanese(text: string): { ko: string; en: string } {
  if (!text) return { ko: '', en: '' };

  let koResult = text;
  let enResult = text;

  // 정렬: 긴 단어부터 매칭하여 부분 매칭 오류 방지
  const sortedKeys = Object.keys(jaToKoEnMap).sort((a, b) => b.length - a.length);

  for (const jaWord of sortedKeys) {
    const { ko, en } = jaToKoEnMap[jaWord];
    if (text.includes(jaWord)) {
      koResult = koResult.replace(new RegExp(jaWord, 'g'), ko);
      enResult = enResult.replace(new RegExp(jaWord, 'g'), en);
    }
  }

  // 일본어 숫자 변환
  for (const [jaNum, num] of Object.entries(jaNumbers)) {
    koResult = koResult.replace(new RegExp(jaNum, 'g'), num);
    enResult = enResult.replace(new RegExp(jaNum, 'g'), num);
  }

  return { ko: koResult, en: enResult };
}

/**
 * 텍스트가 일본어를 포함하는지 확인
 */
export function containsJapanese(text: string): boolean {
  // 히라가나, 카타카나, 일본어 한자 범위 확인
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}

/**
 * 텍스트가 한국어를 포함하는지 확인
 */
export function containsKorean(text: string): boolean {
  const koreanRegex = /[\uAC00-\uD7AF]/;
  return koreanRegex.test(text);
}

/**
 * 텍스트 언어 감지
 */
export function detectLanguage(text: string): 'ja' | 'ko' | 'en' | 'zh' | 'unknown' {
  if (!text) return 'unknown';

  if (containsJapanese(text)) return 'ja';
  if (containsKorean(text)) return 'ko';

  // 중국어 간체/번체 (일본어 한자와 다른 범위)
  const chineseRegex = /[\u4E00-\u9FFF]/;
  if (chineseRegex.test(text) && !containsJapanese(text)) return 'zh';

  // 영어/라틴 문자
  const latinRegex = /^[A-Za-z0-9\s\-.,!?'"()]+$/;
  if (latinRegex.test(text)) return 'en';

  return 'unknown';
}

/**
 * 일본 지역명 한국어/영어 번역
 */
export const japanRegions: Record<string, { ko: string; en: string }> = {
  // 지방
  '北海道': { ko: '홋카이도', en: 'Hokkaido' },
  '東北': { ko: '도호쿠', en: 'Tohoku' },
  '関東': { ko: '간토', en: 'Kanto' },
  '中部': { ko: '주부', en: 'Chubu' },
  '近畿': { ko: '긴키', en: 'Kinki' },
  '関西': { ko: '간사이', en: 'Kansai' },
  '中国': { ko: '주고쿠', en: 'Chugoku' },
  '四国': { ko: '시코쿠', en: 'Shikoku' },
  '九州': { ko: '규슈', en: 'Kyushu' },
  '沖縄': { ko: '오키나와', en: 'Okinawa' },

  // 주요 도시
  '東京': { ko: '도쿄', en: 'Tokyo' },
  '大阪': { ko: '오사카', en: 'Osaka' },
  '京都': { ko: '교토', en: 'Kyoto' },
  '横浜': { ko: '요코하마', en: 'Yokohama' },
  '名古屋': { ko: '나고야', en: 'Nagoya' },
  '札幌': { ko: '삿포로', en: 'Sapporo' },
  '福岡': { ko: '후쿠오카', en: 'Fukuoka' },
  '神戸': { ko: '고베', en: 'Kobe' },
  '仙台': { ko: '센다이', en: 'Sendai' },
  '広島': { ko: '히로시마', en: 'Hiroshima' },
  '長崎': { ko: '나가사키', en: 'Nagasaki' },
  '奈良': { ko: '나라', en: 'Nara' },
  '鳥取': { ko: '돗토리', en: 'Tottori' },
  '金沢': { ko: '가나자와', en: 'Kanazawa' },
  '新潟': { ko: '니가타', en: 'Niigata' },

  // 주요 지역/구
  '渋谷': { ko: '시부야', en: 'Shibuya' },
  '新宿': { ko: '신주쿠', en: 'Shinjuku' },
  '池袋': { ko: '이케부쿠로', en: 'Ikebukuro' },
  '品川': { ko: '시나가와', en: 'Shinagawa' },
  '銀座': { ko: '긴자', en: 'Ginza' },
  '秋葉原': { ko: '아키하바라', en: 'Akihabara' },
  '浅草': { ko: '아사쿠사', en: 'Asakusa' },
  '上野': { ko: '우에노', en: 'Ueno' },
  '六本木': { ko: '롯폰기', en: 'Roppongi' },
  '原宿': { ko: '하라주쿠', en: 'Harajuku' },
  '梅田': { ko: '우메다', en: 'Umeda' },
  '難波': { ko: '난바', en: 'Namba' },
  '心斎橋': { ko: '신사이바시', en: 'Shinsaibashi' },
  '天王寺': { ko: '텐노지', en: 'Tennoji' },
  '博多': { ko: '하카타', en: 'Hakata' },
  '天神': { ko: '텐진', en: 'Tenjin' },
};

/**
 * 전체 텍스트에서 지역명도 포함하여 번역
 */
export function translateJapaneseWithRegions(text: string): { ko: string; en: string } {
  if (!text) return { ko: '', en: '' };

  let koResult = text;
  let enResult = text;

  // 지역명 번역
  const allMappings = { ...jaToKoEnMap, ...japanRegions };
  const sortedKeys = Object.keys(allMappings).sort((a, b) => b.length - a.length);

  for (const jaWord of sortedKeys) {
    const { ko, en } = allMappings[jaWord];
    if (text.includes(jaWord)) {
      koResult = koResult.replace(new RegExp(jaWord, 'g'), ko);
      enResult = enResult.replace(new RegExp(jaWord, 'g'), en);
    }
  }

  // 일본어 숫자 변환
  for (const [jaNum, num] of Object.entries(jaNumbers)) {
    koResult = koResult.replace(new RegExp(jaNum, 'g'), num);
    enResult = enResult.replace(new RegExp(jaNum, 'g'), num);
  }

  return { ko: koResult, en: enResult };
}
