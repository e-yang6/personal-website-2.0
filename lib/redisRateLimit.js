/**
 * Fixed-window rate limit via Upstash REST (same env vars as api/bell.js).
 * Uses EVAL so INCR + EXPIRE on first hit is atomic.
 */

var LUA_INCR_EXPIRE =
  'local n = redis.call("INCR", KEYS[1]) ' +
  'if n == 1 then redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1])) end ' +
  'return n';

function getClientIp(req) {
  var fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  var real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) {
    return real.trim();
  }
  if (req.socket && req.socket.remoteAddress) {
    return String(req.socket.remoteAddress);
  }
  return 'unknown';
}

function rateLimitRedisKey(prefix, clientId) {
  var safe = String(clientId || 'unknown')
    .slice(0, 80)
    .replace(/[^a-zA-Z0-9.:_\-]/g, '_');
  return 'portfolio-rl:' + prefix + ':' + safe;
}

async function upstashEvalIncrExpire(base, token, key, windowSec) {
  var b = (base || '').replace(/\/$/, '');
  var body = JSON.stringify(['EVAL', LUA_INCR_EXPIRE, 1, key, String(windowSec)]);
  var r = await fetch(b, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: body,
  });
  if (!r.ok) {
    throw new Error('Upstash ' + r.status);
  }
  var j = await r.json();
  if (j.error) {
    throw new Error(String(j.error));
  }
  return j.result;
}

/** @param {{ req: object, prefix: string, windowSec: number, max: number }} opts */
async function checkRedisRateLimit(opts) {
  var req = opts.req;
  var prefix = opts.prefix;
  var windowSec = opts.windowSec;
  var max = opts.max;

  var base = process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) {
    return { allowed: true, count: 0, skipped: true };
  }

  var key = rateLimitRedisKey(prefix, getClientIp(req));
  var n = await upstashEvalIncrExpire(base, token, key, windowSec);
  var count = typeof n === 'number' ? n : parseInt(n, 10);
  if (isNaN(count)) {
    count = 0;
  }
  return { allowed: count <= max, count: count, skipped: false };
}

module.exports = {
  getClientIp: getClientIp,
  checkRedisRateLimit: checkRedisRateLimit,
};
