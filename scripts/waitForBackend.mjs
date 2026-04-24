import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.join(__dirname, '..', 'Server', '.env');

const stripWrappingQuotes = (value = '') => {
  const normalizedValue = String(value || '').trim();

  if (
    normalizedValue.length >= 2 &&
    ((normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
      (normalizedValue.startsWith("'") && normalizedValue.endsWith("'")))
  ) {
    return normalizedValue.slice(1, -1);
  }

  return normalizedValue;
};

const readServerPortFromEnvFile = () => {
  if (!fs.existsSync(serverEnvPath)) {
    return '';
  }

  const fileContents = fs.readFileSync(serverEnvPath, 'utf8');
  const lines = fileContents.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(trimmedLine.slice(separatorIndex + 1));

    if (key === 'PORT' && value) {
      return value;
    }
  }

  return '';
};

const host = process.env.DEV_BACKEND_WAIT_HOST || '127.0.0.1';
const port = Number(process.env.DEV_BACKEND_WAIT_PORT || readServerPortFromEnvFile() || 5000);
const timeoutMs = Number(process.env.DEV_BACKEND_WAIT_TIMEOUT_MS || 120000);
const retryDelayMs = Number(process.env.DEV_BACKEND_WAIT_RETRY_MS || 1000);
const deadline = Date.now() + timeoutMs;

const wait = (delayMs) => new Promise((resolve) => {
  setTimeout(resolve, delayMs);
});

const canConnect = () =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });

if (!Number.isInteger(port) || port <= 0) {
  console.error(`[waitForBackend] Invalid backend port: ${port}`);
  process.exit(1);
}

console.log(`[waitForBackend] Waiting for backend on http://${host}:${port}`);

while (Date.now() < deadline) {
  if (await canConnect()) {
    console.log(`[waitForBackend] Backend is ready on http://${host}:${port}`);
    process.exit(0);
  }

  await wait(retryDelayMs);
}

console.error(
  `[waitForBackend] Timed out after ${timeoutMs}ms waiting for backend on http://${host}:${port}`
);
process.exit(1);
