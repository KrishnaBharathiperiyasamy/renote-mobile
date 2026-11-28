import net from 'net';
import http from 'http';

const ports = [
  { name: 'Frontend', port: 6001, path: '/' },
  { name: 'Backend API', port: 6003, path: '/' },
  { name: 'Auth Service', port: 3004, path: '/docs' },
  { name: 'MongoDB', port: 27017, path: null },
];

export function checkPort(port, path = '/') {
  return new Promise((resolve) => {
    // 1. Try TCP connect to 127.0.0.1
    const testConnect = (host, next) => {
      const socket = new net.Socket();
      socket.setTimeout(800);

      socket.once('connect', () => {
        socket.destroy();
        resolve({ active: true, details: `TCP connect to ${host}:${port} succeeded` });
      });

      socket.once('timeout', () => {
        socket.destroy();
        next(new Error('timeout'));
      });

      socket.once('error', (err) => {
        socket.destroy();
        next(err);
      });

      try {
        socket.connect(port, host);
      } catch (err) {
        next(err);
      }
    };

    // 2. Try HTTP check as secondary verification
    const testHttp = () => {
      if (!path) return testBind();
      const req = http.get(
        {
          host: '127.0.0.1',
          port,
          path,
          timeout: 1000,
        },
        (res) => {
          resolve({ active: true, details: `HTTP GET returned status ${res.statusCode}` });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        testBind();
      });
      req.on('error', () => {
        testBind();
      });
    };

    // 3. Fallback: try binding to 127.0.0.1 to check EADDRINUSE
    const testBind = () => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve({ active: true, details: `Port ${port} in use (EADDRINUSE on 127.0.0.1)` });
        } else if (err.code === 'EACCES') {
          // Port access restricted by OS/sandbox ACLs without active listener
          resolve({ active: false, details: `Access restricted (EACCES) - server not detected` });
        } else {
          resolve({ active: false, details: `Error: ${err.code}` });
        }
      });
      server.once('listening', () => {
        server.close(() => resolve({ active: false, details: 'Port available (idle)' }));
      });
      try {
        server.listen(port, '127.0.0.1');
      } catch (err) {
        resolve({ active: false, details: `Listen error: ${err.code || err.message}` });
      }
    };

    // Run connection cascade: 127.0.0.1 -> ::1 -> HTTP -> Bind test
    testConnect('127.0.0.1', (err1) => {
      if (err1 && err1.code === 'ECONNREFUSED') {
        testConnect('::1', (err2) => {
          if (err2 && err2.code === 'ECONNREFUSED') {
            resolve({ active: false, details: 'Connection refused on 127.0.0.1 and ::1' });
          } else {
            testHttp();
          }
        });
      } else {
        testHttp();
      }
    });
  });
}

async function main() {
  console.log('\n--- ReNote Service Port Status ---');
  for (const item of ports) {
    const result = await checkPort(item.port, item.path);
    const status = result.active
      ? '\x1b[32m● ACTIVE\x1b[0m'
      : '\x1b[31m○ IDLE\x1b[0m';
    console.log(`  ${item.name.padEnd(15)} (Port ${item.port}): ${status} \x1b[90m(${result.details})\x1b[0m`);
  }
  console.log('');
}

// Only run main if called directly
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  main();
}


