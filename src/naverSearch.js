const axios = require('axios');

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 카페 게시글 검색 (네이버 검색 API)
async function searchCafePosts(keyword) {
  const res = await axios.get('https://openapi.naver.com/v1/search/cafearticle.json', {
    params: { query: keyword, display: 10, sort: 'date' },
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    },
  });
  return res.data.items || [];
}

module.exports = { searchCafePosts };
