import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'api/data');
const queuePath = path.join(dataDir, 'queue.json');
const auditPath = path.join(dataDir, 'audit.json');

function ensureFile(filePath, emptyValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(emptyValue, null, 2));
  }
}

export function initStore() {
  ensureFile(queuePath, []);
  ensureFile(auditPath, []);
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function getQueue() {
  initStore();
  return readJson(queuePath);
}

export function saveQueue(items) {
  writeJson(queuePath, items);
}

export function getAuditLog() {
  initStore();
  return readJson(auditPath);
}

export function appendAudit(entry) {
  const items = getAuditLog();
  items.push(entry);
  writeJson(auditPath, items);
}

export function paths() {
  return { queuePath, auditPath };
}
