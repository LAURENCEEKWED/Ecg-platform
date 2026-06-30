#!/usr/bin/env node
/**
 * Loop sender — sends an ECG every N seconds for continuous demo
 * Usage: node loop-sender.js [--interval 30] [--count 10]
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const intervalIdx = args.indexOf('--interval');
const countIdx = args.indexOf('--count');
const interval = intervalIdx !== -1 ? parseInt(args[intervalIdx + 1]) : 30;
const maxCount = countIdx !== -1 ? parseInt(args[countIdx + 1]) : 5;

const RHYTHMS = ['NORMAL', 'NORMAL', 'NORMAL', 'BRADYCARDIA', 'TACHYCARDIA', 'AFIB', 'PVC'];

console.log(`\n🔄 Loop Sender: ${maxCount} ECGs every ${interval}s\n`);

let sent = 0;
function sendNext() {
  if (sent >= maxCount) {
    console.log(`\n✅ Done. Sent ${sent} ECGs.`);
    return;
  }
  const rhythm = RHYTHMS[sent % RHYTHMS.length];
  console.log(`[${sent + 1}/${maxCount}] Sending ${rhythm}...`);
  try {
    execSync(`node hospital-client.js --rhythm ${rhythm}`, { stdio: 'inherit', cwd: __dirname });
  } catch {}
  sent++;
  if (sent < maxCount) {
    console.log(`\nNext in ${interval}s...\n`);
    setTimeout(sendNext, interval * 1000);
  } else {
    console.log(`\n✅ All ${maxCount} ECGs sent.`);
  }
}

sendNext();
