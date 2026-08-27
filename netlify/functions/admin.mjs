import crypto from 'node:crypto';
import { connectLambda, getStore } from '@netlify/blobs';

const COOKIE = 'portfolio_admin';
const WEEK = 7 * 24 * 60 * 60;

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function secret() {
  return (process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '').trim();
}

function adminUser() {
  return (process.env.ADMIN_USERNAME || 'admin').trim();
}

function adminPassword() {
  return (process.env.ADMIN_PASSWORD || '').trim();
}

function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function readSession(cookieHeader) {
  if (!cookieHeader || !secret()) {
    return null;
  }
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!match) {
    return null;
  }
  const token = match.slice(COOKIE.length + 1);
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) {
    return null;
  }
  const expected = crypto.createHmac('sha256', secret()).update(encoded).digest('base64url');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function cookieHeader(token, maxAge) {
  const parts = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NETLIFY_DEV !== 'true') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function parseBody(event) {
  const raw = event.body || '';
  const text = event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
  const type = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  if (type.includes('application/json')) {
    return text ? JSON.parse(text) : {};
  }
  const params = new URLSearchParams(text);
  return Object.fromEntries(params.entries());
}

function normalizeEmail(value) {
  let email = (value || '').trim();
  if (email.toLowerCase().startsWith('mailto:')) {
    email = email.slice(7).trim();
  }
  email = email.split('?')[0].trim();
  if (!email.includes('@') || email.includes(' ')) {
    return '';
  }
  return email;
}

function isEmailSocial(social) {
  const platform = (social.platform || '').toLowerCase();
  const url = (social.url || '').toLowerCase();
  return platform.includes('mail') || url.startsWith('mailto:') || url.includes('@');
}

function applyContactEmail(data) {
  const email = normalizeEmail((data.personal_info || {}).email);
  data.personal_info = data.personal_info || {};
  data.personal_info.email = email;
  data.social_links = Array.isArray(data.social_links) ? data.social_links : [];
  if (!email) {
    return data;
  }
  const mailUrl = `mailto:${email}`;
  let found = false;
  data.social_links = data.social_links.map((social) => {
    if (isEmailSocial(social)) {
      found = true;
      return { ...social, url: mailUrl };
    }
    return social;
  });
  if (!found) {
    data.social_links.push({ platform: 'Email', url: mailUrl, icon: 'fas fa-envelope' });
  }
  return data;
}

function cleanData(input) {
  const data = input && typeof input === 'object' ? input : {};
  return applyContactEmail({
    personal_info: {
      name: (data.personal_info?.name || '').trim(),
      title: (data.personal_info?.title || '').trim(),
      about: data.personal_info?.about || '',
      location: (data.personal_info?.location || '').trim(),
      email: data.personal_info?.email || '',
      phone: (data.personal_info?.phone || '').trim(),
      profile_image: (data.personal_info?.profile_image || '').trim(),
      resume: (data.personal_info?.resume || '').trim(),
    },
    skills: Array.isArray(data.skills) ? data.skills : [],
    education: Array.isArray(data.education) ? data.education : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    social_links: Array.isArray(data.social_links) ? data.social_links : [],
  });
}

async function store() {
  return getStore('portfolio');
}

export async function handler(event) {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const action = (event.queryStringParameters || {}).action || '';
  const session = readSession(event.headers.cookie || event.headers.Cookie || '');

  try {
    if (method === 'POST' && action === 'login') {
      if (!adminPassword() || !secret()) {
        return json(500, { error: 'Admin login is not configured on this site.' });
      }
      const body = parseBody(event);
      const username = (body.username || '').trim();
      const password = body.password || '';
      if (username.toLowerCase() !== adminUser().toLowerCase() || password !== adminPassword()) {
        return json(401, { error: 'Invalid username or password.' });
      }
      const token = sign({ u: adminUser(), exp: Date.now() + WEEK * 1000 });
      return json(200, { ok: true }, { 'Set-Cookie': cookieHeader(token, WEEK) });
    }

    if ((method === 'POST' || method === 'GET') && action === 'logout') {
      return json(200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
    }

    if (method === 'GET' && action === 'session') {
      return json(session ? 200 : 401, { ok: Boolean(session) });
    }

    if (!session) {
      return json(401, { error: 'Please login as admin.' });
    }

    connectLambda(event);
    const blobs = await store();

    if (method === 'GET' && action === 'data') {
      const data = await blobs.get('data', { type: 'json' });
      return json(200, { data: data || null });
    }

    if (method === 'PUT' && action === 'data') {
      const body = parseBody(event);
      const data = cleanData(body.data || body);
      await blobs.setJSON('data', data);
      return json(200, { ok: true, data });
    }

    return json(404, { error: 'Unknown admin action.' });
  } catch (error) {
    return json(500, { error: 'Admin request failed. Try again.' });
  }
}
