// Builds fake-camera videos (Chrome --use-file-for-fake-video-capture) that
// show real ticket QR codes, so the scanner is exercised end to end.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const QR = createRequire(new URL('../package.json', import.meta.url))('qrcode');
const dir = fileURLToPath(new URL('./cam/', import.meta.url));
mkdirSync(dir, { recursive: true });
const token = (n) => execFileSync('docker', ['exec', process.env.DB_CONTAINER, 'psql', '-U', 'postgres', '-Atc',
  `select token from tickets where ticket_number = '${n}'`]).toString().trim();

for (const [name, value] of [
  ['valid', `TANGY:TICKET:${token('TS-LOCAL003-01')}`],   // Vol. 5 (the event being worked)
  ['wrong', `TANGY:TICKET:${token('TS-LOCAL005-01')}`],   // Vol. 6 ticket
  ['invalid', 'TANGY:TICKET:not-a-real-ticket'],
]) {
  await QR.toFile(`${dir}${name}.png`, value, { width: 480, margin: 4 });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-loop', '1', '-i', `${dir}${name}.png`, '-t', '4', '-r', '10',
    '-vf', 'scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p', `${dir}${name}.y4m`]);
}
console.log('fake camera videos ready');
