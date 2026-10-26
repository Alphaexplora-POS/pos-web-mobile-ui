const configuredOrigin = process.env.BACKEND_ORIGIN?.trim();
if (!configuredOrigin) {
  throw new Error('Set BACKEND_ORIGIN in Vercel to the HTTPS origin of the deployed Express backend (without /api).');
}

let backend;
try {
  backend = new URL(configuredOrigin);
} catch {
  throw new Error('BACKEND_ORIGIN must be a valid HTTPS origin, without /api, credentials, or query parameters.');
}

if (
  backend.protocol !== 'https:' ||
  backend.pathname !== '/' ||
  backend.username || backend.password || backend.search || backend.hash ||
  ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname) ||
  backend.hostname.endsWith('.localhost')
) {
  throw new Error('BACKEND_ORIGIN must be a public HTTPS origin, without /api, credentials, or query parameters.');
}

const browserBase = process.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '/api';
if (browserBase !== '/api') {
  throw new Error('For this Vercel setup, set VITE_API_BASE_URL=/api and put the backend origin in BACKEND_ORIGIN.');
}

if ([process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].includes(backend.host)) {
  throw new Error('BACKEND_ORIGIN points to this frontend. Use the Express backend origin to avoid a proxy loop.');
}

export const config = {
  framework: 'vite',
  installCommand: 'npm ci --include=dev',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [
    { source: '/api/:path*', destination: `${backend.origin}/api/:path*` },
    { source: '/(.*)', destination: '/index.html' },
  ],
};
