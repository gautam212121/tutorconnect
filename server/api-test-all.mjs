import 'dotenv/config';
import mysql from 'mysql2/promise';

const BASE = 'http://localhost:5000';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dump = (value) => {
  if (value === null || value === undefined) return `${value}`;
  if (typeof value === 'string') return value.length > 180 ? value.slice(0, 180) + '...' : value;
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') return `Object(${Object.keys(value).length})`;
  return String(value);
};

const request = async (name, method, path, options = {}) => {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { method, ...options });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    console.log(`\n[${name}] ${method} ${path} -> ${res.status} ${res.ok ? 'OK' : 'FAIL'}`);
    if (typeof body === 'string' && body.length > 280) {
      console.log('BODY:', body.slice(0, 280), '...');
    } else if (Array.isArray(body)) {
      console.log('BODY:', `Array(${body.length})`, body.length > 0 ? dump(body[0]) : '[]');
    } else if (typeof body === 'object' && body !== null) {
      console.log('BODY:', dump(body));
      if (body && Object.keys(body).length > 0) {
        const firstKey = Object.keys(body)[0];
        console.log('FIRST KEY:', firstKey, dump(body[firstKey]));
      }
    } else {
      console.log('BODY:', dump(body));
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.log(`\n[${name}] ${method} ${path} -> ERROR`, err.message);
    return { ok: false, status: 0, error: err.message };
  }
};

const getOtp = async (email) => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await conn.execute('SELECT otp, email, used, expiresAt, createdAt FROM otps WHERE email = ? ORDER BY createdAt DESC LIMIT 1', [email]);
  await conn.end();
  if (!rows.length) {
    throw new Error(`No OTP row found for ${email}`);
  }
  return rows[0].otp;
};

const login = async (email) => {
  console.log(`\n--- login for ${email} ---`);
  await request(`send-login-otp ${email}`, 'POST', '/api/v1/auth/send-login-otp', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  await delay(500);
  const otp = await getOtp(email);
  console.log('OTP found:', otp);
  const loginRes = await request(`login-otp ${email}`, 'POST', '/api/v1/auth/login-otp', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (loginRes.ok && loginRes.body && loginRes.body.token) {
    return loginRes.body.token;
  }
  throw new Error(`Login failed for ${email}`);
};

const run = async () => {
  const publicTests = [
    ['Health', 'GET', '/health'],
    ['Platform Stats', 'GET', '/api/v1/stats/platform'],
    ['Settings', 'GET', '/api/v1/settings'],
    ['Categories', 'GET', '/api/v1/categories'],
    ['Category By ID', 'GET', '/api/v1/categories/1'],
    ['Subjects', 'GET', '/api/v1/subjects'],
    ['Featured Tutors', 'GET', '/api/v1/tutors/featured'],
    ['Tutor Search', 'GET', '/api/v1/tutors/search?query=math'],
    ['Tutor Detail', 'GET', '/api/v1/tutors/2'],
    ['Callback Submit', 'POST', '/api/v1/callback', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test User', email: 'testuser@example.com', phone: '9999999999', subject: 'Math', classLevel: '10', mode: 'Online', location: 'Test City' }) }],
    ['Newsletter Subscribe', 'POST', '/api/v1/newsletter/subscribe', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `test-${Date.now()}@example.com` }) }],
    ['Commission Info', 'GET', '/api/v1/config/commission'],
    ['Platform Info', 'GET', '/api/v1/config/info'],
    ['Subscription Plans', 'GET', '/api/v1/subscriptions/plans'],
  ];

  for (const [name, method, path, opts] of publicTests) {
    await request(name, method, path, opts);
  }

  const studentToken = await login('student@tutorconnect.com');
  const tutorToken = await login('tutor@tutorconnect.com');
  const adminToken = await login('admin@tutorconnect.com');

  const authTests = [
    ['Student Bookings', 'GET', '/api/v1/bookings/student/3', studentToken],
    ['Student Inbox', 'GET', '/api/v1/messages/inbox/3', studentToken],
    ['Tutor Bookings', 'GET', '/api/v1/bookings/tutor/2', tutorToken],
    ['Tutor Lead Stats', 'GET', '/api/v1/leads/tutor/2/stats', tutorToken],
    ['Tutor Leads', 'GET', '/api/v1/leads/tutor/2', tutorToken],
    ['Tutor Subscription', 'GET', '/api/v1/subscriptions/my', tutorToken],
    ['Tutor Wallet', 'GET', '/api/v1/wallet/', tutorToken],
    ['Tutor Transactions', 'GET', '/api/v1/wallet/transactions', tutorToken],
    ['Tutor Inbox', 'GET', '/api/v1/messages/inbox/2', tutorToken],
    ['Admin Config', 'GET', '/api/v1/config/admin', adminToken],
    ['Admin Users', 'GET', '/api/v1/admin/users', adminToken],
    ['Admin Newsletter', 'GET', '/api/v1/admin/newsletter', adminToken],
    ['Admin Leads', 'GET', '/api/v1/leads', adminToken],
    ['Admin Disputes', 'GET', '/api/v1/leads/disputes', adminToken],
    ['Admin Withdrawals', 'GET', '/api/v1/wallet/admin/withdrawals', adminToken],
    ['Admin Payout Summary', 'GET', '/api/v1/wallet/admin/payout-summary', adminToken],
  ];

  for (const [name, method, path, token] of authTests) {
    await request(name, method, path, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  console.log('\n--- ALL TESTS COMPLETE ---');
};

run().catch((err) => {
  console.error('Test script failed:', err.message);
  process.exit(1);
});
