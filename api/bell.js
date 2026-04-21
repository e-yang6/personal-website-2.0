/**
 * GET /api/bell  → { count }
 * POST /api/bell → increments total rings, returns { count }
 *
 * Persistence (pick one for production on serverless):
 * - Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (Upstash Redis REST, free tier).
 * - Else falls back to data/bell-count.json (works for local Node; Vercel filesystem is not durable).
 */
var fs = require('fs');
var path = require('path');

var KEY = 'portfolio-bell-total';
var DATA_FILE = path.join(__dirname, '..', 'data', 'bell-count.json');

function upstashUrl(base, command) {
  var b = (base || '').replace(/\/$/, '');
  return b + '/' + command.join('/');
}

async function upstashGet(url, token) {
  var r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('Upstash ' + r.status);
  var j = await r.json();
  return j.result;
}

async function readCountRedis() {
  var base = process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;
  var raw = await upstashGet(upstashUrl(base, ['get', KEY]), token);
  if (raw == null || raw === '') return 0;
  var n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

async function incrCountRedis() {
  var base = process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;
  var raw = await upstashGet(upstashUrl(base, ['incr', KEY]), token);
  var n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

function readCountFileSync() {
  try {
    var raw = fs.readFileSync(DATA_FILE, 'utf8');
    var j = JSON.parse(raw);
    var n = parseInt(j.count, 10);
    return isNaN(n) ? 0 : n;
  } catch (e) {
    return 0;
  }
}

function writeCountFileSync(n) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ count: n }) + '\n', 'utf8');
}

async function readCount() {
  try {
    var r = await readCountRedis();
    if (r !== null) return r;
  } catch (e) {
    console.warn('Bell counter Redis read failed:', e.message);
  }
  return readCountFileSync();
}

async function incrCount() {
  try {
    var r = await incrCountRedis();
    if (r !== null) return r;
  } catch (e) {
    console.warn('Bell counter Redis incr failed:', e.message);
  }
  try {
    var n = readCountFileSync() + 1;
    writeCountFileSync(n);
    return n;
  } catch (e) {
    console.warn('Bell counter file write failed:', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET') {
      var count = await readCount();
      return res.status(200).json({ count: count });
    }
    if (req.method === 'POST') {
      var next = await incrCount();
      if (next === null) {
        return res.status(503).json({ count: null, error: 'counter_unavailable' });
      }
      return res.status(200).json({ count: next });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.warn('Bell API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
