import net from 'net';
import { spawn, execSync } from 'child_process';
import { checkPort } from './check-ports.mjs';

const FRONTEND_PORT = 6001;
const BACKEND_PORT = 6003;
const DEVTUNNEL_URL =
  process.env.DEVTUNNEL_URL ||
  process.env.TUNNEL_URL ||
  process.argv[2] ||
  null;

function getDevTunnelCliStatus() {
  try {
    const output = execSync('devtunnel --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const match = output.match(/Tunnel CLI version:\s*([^\r\n]+)/i) || output.match(/CLI version:\s*([^\r\n]+)/i);
    return { installed: true, version: match ? match[1].trim() : '1.0' };
  } catch {
    return { installed: false, version: null };
  }
}

async function main() {
  console.log('\n\x1b[36m════════════════════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m\x1b[32m          🌐 ReNote Automated Public Port Forwarding & Dev Tunnel          \x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════════════════════════════════════\x1b[0m\n');

  console.log('\x1b[90m[1/4] Checking local service health...\x1b[0m');
  const [frontendCheck, backendCheck] = await Promise.all([
    checkPort(FRONTEND_PORT, '/'),
    checkPort(BACKEND_PORT, '/'),
  ]);

  const fStatus = frontendCheck.active
    ? '\x1b[32m● ACTIVE\x1b[0m'
    : `\x1b[33m○ PENDING / IDLE\x1b[0m \x1b[90m(${frontendCheck.details})\x1b[0m`;
  const bStatus = backendCheck.active
    ? '\x1b[32m● ACTIVE\x1b[0m'
    : `\x1b[33m○ PENDING / IDLE\x1b[0m \x1b[90m(${backendCheck.details})\x1b[0m`;

  console.log(`  • Frontend (Port ${FRONTEND_PORT}): ${fStatus}`);
  console.log(`  • Backend  (Port ${BACKEND_PORT}): ${bStatus}\n`);

  console.log('\x1b[90m[2/4] Microsoft Dev Tunnel CLI Status...\x1b[0m');
  const cliStatus = getDevTunnelCliStatus();
  if (cliStatus.installed) {
    console.log(`  • devtunnel CLI: \x1b[32mInstalled\x1b[0m (${cliStatus.version})`);
  } else {
    console.log('  • devtunnel CLI: \x1b[90mUsing VS Code built-in Dev Tunnel integration\x1b[0m');
  }

  console.log('\n\x1b[1m\x1b[33m[3/4] Public HTTPS Application Endpoint\x1b[0m');
  if (DEVTUNNEL_URL) {
    console.log(`  🔗 Public URL: \x1b[1m\x1b[36m${DEVTUNNEL_URL}\x1b[0m\n`);
  } else {
    console.log('  🔗 Copy the live Public URL from the \x1b[32mForwarded Address\x1b[0m column in VS Code\'s \x1b[32mPORTS\x1b[0m tab.\n');
  }

  console.log('\x1b[1m\x1b[33m[4/4] VS Code Dev Tunnel & Port Forwarding Checklist\x1b[0m');
  console.log('\x1b[1m  A. Anonymous Public Access (No GitHub sign-in required):\x1b[0m');
  console.log('     1. Open the \x1b[32m"PORTS"\x1b[0m tab in the VS Code bottom panel.');
  console.log('     2. Locate Port \x1b[32m6001\x1b[0m (Forwarded Address: localhost:6001).');
  console.log('     3. Right-click port \x1b[32m6001\x1b[0m -> select \x1b[33mPort Visibility -> Public\x1b[0m.');
  console.log('        \x1b[90m(The lock icon becomes a public globe icon; anyone with the URL can access ReNote)\x1b[0m');
  console.log('\x1b[1m  B. Avoiding 502 Bad Gateway:\x1b[0m');
  console.log('     1. In the same PORTS tab, ensure the \x1b[33mPort Protocol\x1b[0m for 6001 is set to \x1b[32mHTTP\x1b[0m.');
  console.log('        \x1b[90m(Setting protocol to HTTPS locally triggers "502 Bad Gateway" because Next.js dev server runs HTTP)\x1b[0m');
  console.log('     2. Verify Next.js dev server is running on port 6001 (`npm run dev:frontend` or `npm run dev`).');
  console.log('\x1b[1m  C. Backend & Asset Proxying:\x1b[0m');
  console.log('     • Next.js rewrites transparently proxy `/api/*`, `/uploads/*`, and `/socket.io/*` to localhost:6003.');
  console.log('     • External visitors do not face Mixed Content or localhost CORS blocks.');
  console.log('     • Next.js `allowedDevOrigins` allows `**.devtunnels.ms` cross-site requests.');
  console.log('     • Express backend and Socket.IO servers permit all `.devtunnels.ms` origins with credentials.');
  console.log('\n\x1b[36m════════════════════════════════════════════════════════════════════════════\x1b[0m\n');
}

main();
