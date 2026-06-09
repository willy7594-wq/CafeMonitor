const fs = require('fs');
const path = require('path');

const HISTORY_PATH = path.join(__dirname, '..', 'sent-articles.json');
const KEEP_DAYS = 30;

function load() {
  try {
    if (!fs.existsSync(HISTORY_PATH)) return {};
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function save(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
}

function cleanup(history) {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const [url, sentAt] of Object.entries(history)) {
    if (sentAt < cutoff) delete history[url];
  }
}

function isSent(history, url) {
  return !!history[url];
}

function markSent(history, urls) {
  const now = Date.now();
  for (const url of urls) {
    history[url] = now;
  }
}

module.exports = { load, save, cleanup, isSent, markSent };
