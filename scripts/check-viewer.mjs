import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewer = path.resolve(process.env.POSTHOLE_VIEWER || path.join(root, '../viewer'));
const hashes = JSON.parse(fs.readFileSync(path.join(root, 'public/demo/source-hashes.json'), 'utf8'));
for (const [file, expected] of Object.entries(hashes)) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(viewer, file))).digest('hex');
  if (actual !== expected) throw new Error(`Demo is out of sync with viewer/${file}. Run npm run render:interfaces.`);
}
console.log('Demo snapshot matches the local viewer source.');
