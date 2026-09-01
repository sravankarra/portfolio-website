import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const site = process.env.NETLIFY_SITE_URL || 'https://sravan-karra-portfolio.netlify.app';
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'SravanAdmin2026';

const data = JSON.parse(readFileSync(join(root, 'portfolio_data.json'), 'utf8'));
data.personal_info.profile_image = '/static/images/profile-cutout.webp';

async function main() {
  const loginRes = await fetch(`${site}/api/admin?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    throw new Error(loginBody.error || `Login failed (${loginRes.status})`);
  }

  const rawCookie = loginRes.headers.get('set-cookie') || '';
  const cookie = rawCookie.split(',')[0]?.split(';')[0]?.trim();
  if (!cookie || !cookie.includes('=')) {
    throw new Error('Login succeeded but no session cookie was returned.');
  }

  const saveRes = await fetch(`${site}/api/admin?action=data`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ data }),
  });
  const saveBody = await saveRes.json().catch(() => ({}));
  if (!saveRes.ok) {
    throw new Error(saveBody.error || `Save failed (${saveRes.status})`);
  }

  const check = await fetch(`${site}/api/portfolio`);
  const live = await check.json();
  console.log('Live phone:', live?.personal_info?.phone || '(empty)');
  console.log('Live profile:', live?.personal_info?.profile_image || '(empty)');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
