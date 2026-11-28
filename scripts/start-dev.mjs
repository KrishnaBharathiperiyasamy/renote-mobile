import net from 'net';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkPort } from './check-ports.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FRONTEND_PORT = 6001;
const BACKEND_PORT = 6003;

const forceStart = process.argv.includes('--force');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

async function isPortInUse(port, checkPath = '/') {
  if (forceStart) return false;
  const result = await checkPort(port, checkPath);
  return result.active;
}

const spawnedProcesses = [];

function cleanup() {
  if (spawnedProcesses.length === 0) {
    process.exit(0);
  }
  console.log(`\n${colors.yellow}Shutting down processes started in this session...${colors.reset}`);
  for (const proc of spawnedProcesses) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        proc.kill('SIGTERM');
      }
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function main() {
  console.log(`\n${colors.bright}${colors.cyan}═════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}   🚀 ReNote Unified Development Launcher   ${colors.reset}`);
  console.log(`${colors.cyan}═════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.dim}Checking existing ports to avoid duplicate servers...${colors.reset}`);

  const [backendActive, frontendActive] = await Promise.all([
    isPortInUse(BACKEND_PORT),
    isPortInUse(FRONTEND_PORT),
  ]);

  // --- Backend Service (Port 6003) ---
  if (backendActive) {
    console.log(
      `${colors.green}✓ Backend API is already running on port ${BACKEND_PORT}.${colors.reset} ${colors.dim}(reusing active process)${colors.reset}`
    );
  } else {
    console.log(`${colors.cyan}➜ Starting Backend on port ${BACKEND_PORT}...${colors.reset}`);
    const backendProc = spawn('npm run dev', {
      cwd: path.join(rootDir, 'backend'),
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(BACKEND_PORT), FORCE_COLOR: '1' },
    });
    backendProc.on('error', (err) => {
      console.error(`${colors.red}[Backend] Failed to start: ${err.message}${colors.reset}`);
    });
    spawnedProcesses.push(backendProc);
  }

  // --- Frontend Service (Port 6001) ---
  if (frontendActive) {
    console.log(
      `${colors.green}✓ Frontend is already running on port ${FRONTEND_PORT}.${colors.reset} ${colors.dim}(reusing active process)${colors.reset}`
    );
  } else {
    console.log(`${colors.cyan}➜ Starting Frontend on port ${FRONTEND_PORT}...${colors.reset}`);
    const frontendProc = spawn('npm run dev', {
      cwd: path.join(rootDir, 'frontend'),
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(FRONTEND_PORT), FORCE_COLOR: '1' },
    });
    frontendProc.on('error', (err) => {
      console.error(`${colors.red}[Frontend] Failed to start: ${err.message}${colors.reset}`);
    });
    spawnedProcesses.push(frontendProc);
  }

  console.log(`\n${colors.bright}Active Service Endpoints:${colors.reset}`);
  console.log(`  • Frontend:    ${colors.bright}${colors.green}http://localhost:${FRONTEND_PORT}${colors.reset}`);
  console.log(`  • Backend API: ${colors.bright}${colors.green}http://localhost:${BACKEND_PORT}${colors.reset}`);
  console.log(`\n${colors.dim}Press Ctrl+C to stop services started in this session.${colors.reset}\n`);
}

main().catch((err) => {
  console.error(`${colors.red}Startup error: ${err.message}${colors.reset}`);
  process.exit(1);
});
