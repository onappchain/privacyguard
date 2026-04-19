import fs from 'fs';
import path from 'path';

const targetsPath = path.resolve(process.cwd(), 'api/data/targets.json');

export function getTargets() {
  return JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
}

export function getTargetById(id) {
  return getTargets().find((target) => target.id === id);
}
