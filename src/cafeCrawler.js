const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CAFE_ID = 'biz_sangsaeng'; // 아프니까 사장이다
const CAFE_SEARCH_URL = 'https://cafe.naver.com/ArticleSearchList.nhn';

// NaverToKatalk의 cookies.json을 공유 사용 (같은 네이버 계정)
const COOKIES_PATH = process.env.NAVER_SHARED_COOKIES_PATH ||
  path.join(__dirname, '..', '..', 'NaverToKatalk', 'cookies.json');

function loadCookieHeader() {
  if (!fs.existsSync(COOKIES_PATH)) {
    console.warn('[cafeCrawler] cookies.json 없음 경로:', COOKIES_PATH);
    return null;
  }
  try {
    const state = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
    if (!Array.isArray(state.cookies) || state.cookies.length === 0) return null;
    const relevant = state.cookies.filter(c =>
      c.domain && c.domain.includes('naver.com')
    );
    if (relevant.length === 0) return null;
    return relevant.map(c => `${c.name}=${c.value}`).join('; ');
  } catch (e) {
    console.warn('[cafeCrawler] cookies.json 읽기 실패:', e.message);
    return null;
  }
}

async function searchCafeArticles(keyword) {
  const cookie = loadCookieHeader();
  if (!cookie) {
    console.warn('[cafeCrawler] 유효한 쿠키 없음 — 크롤링 건너뜀');
    return [];
  }

  const res = await axios.get(CAFE_SEARCH_URL, {
    params: {
      'search.clubid': CAFE_ID,
      'search.searchBy': 1,
      'search.query': keyword,
      'search.defaultValue': 1,
    },
    headers: {
      Cookie: cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://cafe.naver.com/',
    },
  });

  const $ = cheerio.load(res.data);
  const articles = [];

  $('.article-list .article-item').each((_, el) => {
    const title = $(el).find('.article-title').text().trim();
    const href = $(el).find('a').attr('href') || '';
    const link = href.startsWith('http') ? href : 'https://cafe.naver.com' + href;
    const date = $(el).find('.article-date').text().trim();
    if (title) articles.push({ title, link, date, source: '아프니까사장이다' });
  });

  return articles;
}

module.exports = { searchCafeArticles };
