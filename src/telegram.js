const axios = require('axios');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(text) {
  await axios.post(`${BASE_URL}/sendMessage`, {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

module.exports = { sendMessage };
