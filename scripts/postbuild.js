import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const shellPath = path.resolve(__dirname, '../dist/client/_shell.html');
const indexPath = path.resolve(__dirname, '../dist/client/index.html');

if (fs.existsSync(shellPath)) {
  fs.copyFileSync(shellPath, indexPath);
  console.log('Successfully copied dist/client/_shell.html to dist/client/index.html');
} else {
  console.error('Error: dist/client/_shell.html not found!');
  process.exit(1);
}
