const User = require('../models/User');

// Parse User-Agent + optional X-Client header into a readable device string
function parseDevice(ua, clientHeader) {
  if (clientHeader === 'mobile') return 'Mobile App';
  if (!ua) return 'Unknown';
  if (/iPhone/i.test(ua))  return 'iPhone';
  if (/iPad/i.test(ua))    return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Expo|React Native/i.test(ua)) return 'Mobile App';
  if (/Edg\//i.test(ua))   return 'Edge';
  if (/Chrome/i.test(ua))  return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua))  return 'Safari';
  return 'Web';
}

// Call on any dashboard/home load — non-blocking
function trackVisit(userId, req) {
  const device = parseDevice(req.headers['user-agent'], req.headers['x-client']);
  User.findByIdAndUpdate(userId, {
    'lastActivity.lastVisit': new Date(),
    'lastActivity.lastDevice': device,
  }).catch(() => {});
}

// Call after any successful write (POST/PUT/DELETE) — non-blocking
function trackUpdate(userId) {
  User.findByIdAndUpdate(userId, {
    'lastActivity.lastUpdate': new Date(),
  }).catch(() => {});
}

module.exports = { trackVisit, trackUpdate };
