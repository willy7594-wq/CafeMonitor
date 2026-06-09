const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const PROMPT = (title, desc) =>
`다음 글이 네이버 예약 알림을 카카오 알림톡(카카오톡)으로 자동 발송하는 방법을 문의하거나, 예약 알림 자동화 서비스를 찾고 있는 내용인가요?
YES 또는 NO로만 답하세요.

제목: ${title}
내용: ${desc}`;

async function isRelevant(item) {
  const title = item.title || '';
  const desc = item.description ? item.description.slice(0, 300) : '';

  try {
    const res = await axios.post(`${API_URL}?key=${API_KEY}`, {
      contents: [{ parts: [{ text: PROMPT(title, desc) }] }],
      generationConfig: { maxOutputTokens: 5, temperature: 0 },
    });
    const answer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || '';
    return answer.startsWith('YES');
  } catch (e) {
    console.warn(`[aiFilter] 오류 (포함 처리):`, e.response?.data?.error?.message || e.message);
    return true; // 오류 시 놓치지 않도록 포함
  }
}

async function filterRelevant(items) {
  if (!API_KEY) {
    console.warn('[aiFilter] GEMINI_API_KEY 없음 — AI 필터링 건너뜀');
    return items;
  }

  console.log(`[aiFilter] AI 필터링 시작 — ${items.length}건`);
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const relevant = await isRelevant(items[i]);
    if (relevant) results.push(items[i]);
    // Gemini 무료 15RPM 제한: 4.1초 간격
    if (i < items.length - 1) await new Promise(r => setTimeout(r, 4100));
  }

  console.log(`[aiFilter] 필터링 완료 — ${items.length}건 중 ${results.length}건 통과`);
  return results;
}

module.exports = { filterRelevant };
