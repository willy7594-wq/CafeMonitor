const axios = require('axios');

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

async function searchKin(keyword) {
  const res = await axios.get('https://openapi.naver.com/v1/search/kin.json', {
    params: { query: keyword, display: 10, sort: 'date' },
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    },
  });
  return (res.data.items || []).map(i => ({ ...i, source: '지식iN' }));
}

module.exports = { searchKin };
