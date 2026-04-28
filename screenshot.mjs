import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Ensure output directory exists
const screenshotDir = join(__dirname, 'temporary screenshots');
if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true });

// Find next available screenshot number
const existing = readdirSync(screenshotDir).filter(f => /^screenshot-\d+/.test(f));
const nums = existing.map(f => parseInt(f.replace('screenshot-', '').split(/[-\.]/)[0])).filter(n => !isNaN(n));
const nextN = nums.length > 0 ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${nextN}-${label}.png` : `screenshot-${nextN}.png`;
const outputPath = join(screenshotDir, filename);

// Possible Chrome paths to try
const chromePaths = [
  'C:/Users/nateh/.cache/puppeteer/chrome/win64-131.0.6778.264/chrome-win64/chrome.exe',
  process.env.PUPPETEER_EXECUTABLE_PATH,
].filter(Boolean);

let browser;
for (const executablePath of chromePaths) {
  try {
    browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    break;
  } catch (_) {}
}
if (!browser) {
  // Fall back to letting puppeteer find its own bundled Chrome
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
}

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Give any animations a moment to settle
await new Promise(r => setTimeout(r, 800));

await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outputPath}`);
