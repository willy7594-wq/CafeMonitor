const https = require('https');
const axios = require('axios');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

// 서버에 IPv6 라우트가 없는데 api.telegram.org가 AAAA 레코드도 응답해서
// IPv6로 접속 시도하다 ETIMEDOUT 나는 문제 회피 — IPv4로 강제
const httpsAgent = new https.Agent({ family: 4 });

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(text) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await axios.post(`${BASE_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }, { httpsAgent, timeout: 15000 });
      return;
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      console.error(`[telegram] 전송 실패 (${attempt}/${MAX_RETRIES}), ${RETRY_DELAY_MS}ms 후 재시도:`, e.message);
      await delay(RETRY_DELAY_MS);
    }
  }
}

module.exports = { sendMessage };
