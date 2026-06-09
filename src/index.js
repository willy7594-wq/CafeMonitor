require('dotenv').config();
const cron = require('node-cron');
const { searchCafePosts } = require('./naverSearch');
const { searchCafeArticles } = require('./cafeCrawler');
const { sendMessage } = require('./telegram');
const history = require('./sentHistory');

const KEYWORDS = (process.env.SEARCH_KEYWORDS || '네이버 예약 알림톡')
  .split(',')
  .map(k => k.trim());

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

function formatDate(raw) {
  if (!raw) return '';
  // postdate: '20230817' → '2023.08.17'
  const s = String(raw).replace(/\D/g, '');
  if (s.length === 8) return `${s.slice(0,4)}.${s.slice(4,6)}.${s.slice(6,8)}`;
  return raw;
}

function formatArticles(items) {
  return items.map((item, i) => {
    const title = stripHtml(item.title || item.subject || '(제목 없음)');
    const link = item.link || item.url || '';
    const date = formatDate(item.postdate || item.date || '');
    const source = item.source || item.cafename || '네이버카페';
    const desc = item.description ? '\n  ' + stripHtml(item.description).slice(0, 80).trim() + '…' : '';
    return `${i + 1}. <a href="${link}">${title}</a>${desc}\n  📌 ${source} | ${date}`;
  }).join('\n\n');
}

async function runMonitor() {
  console.log(`[${new Date().toLocaleString('ko-KR')}] 모니터링 시작`);
  const allResults = [];

  for (const keyword of KEYWORDS) {
    try {
      const apiItems = await searchCafePosts(keyword);
      allResults.push(...apiItems.map(i => ({ ...i, source: i.cafename || '네이버카페' })));
    } catch (e) {
      console.error(`[naverSearch] 키워드 "${keyword}" 오류:`, e.message);
    }

    try {
      const crawlItems = await searchCafeArticles(keyword);
      allResults.push(...crawlItems);
    } catch (e) {
      console.error(`[cafeCrawler] 키워드 "${keyword}" 오류:`, e.message);
    }
  }

  // 발송 이력 로드 및 30일 지난 항목 정리
  const sent = history.load();
  history.cleanup(sent);

  // 중복 URL 제거 + 이미 보낸 것 제외
  const seen = new Set();
  const newItems = allResults.filter(item => {
    const key = item.link || item.url || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return !history.isSent(sent, key);
  });

  if (newItems.length === 0) {
    console.log(`[${new Date().toLocaleString('ko-KR')}] 새 게시글 없음`);
    await sendMessage('📋 새로 수집된 게시글이 없습니다.');
    history.save(sent);
    return;
  }

  const body = formatArticles(newItems);
  const msg = `📣 <b>네이버 예약 알림톡 관련 새 게시글 (${newItems.length}건)</b>\n\n${body}`;

  // 4096자 제한 분할 전송
  const chunks = [];
  let current = '';
  for (const line of msg.split('\n\n')) {
    if ((current + '\n\n' + line).length > 4000) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n\n' + line : line;
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    await sendMessage(chunk);
  }

  // 발송 완료 후 이력 저장
  history.markSent(sent, newItems.map(i => i.link || i.url || i.title));
  history.save(sent);

  console.log(`[${new Date().toLocaleString('ko-KR')}] 완료 — ${newItems.length}건 전송`);
}

// 매일 오전 7시 실행
cron.schedule('0 7 * * *', runMonitor, { timezone: 'Asia/Seoul' });

console.log('CafeMonitor 시작 — 매일 07:00 KST 실행');

// 즉시 1회 실행 (테스트용, 배포 후 제거 가능)
runMonitor();
