const memoryState = {
  queue: [],
  audit: []
};

function getStoreMode() {
  if (process.env.PRIVACYGUARD_STORE_MODE) {
    return process.env.PRIVACYGUARD_STORE_MODE;
  }
  return process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'memory';
}

function blobBaseUrl() {
  const url = process.env.BLOB_BASE_URL || process.env.BLOB_STORE_URL;
  if (!url) {
    throw new Error('Missing BLOB_BASE_URL or BLOB_STORE_URL');
  }
  return url.replace(/\/$/, '');
}

function blobHeaders(contentType = 'application/json') {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': contentType
  };
}

async function blobGetJson(key, emptyValue) {
  const response = await fetch(`${blobBaseUrl()}/${key}`, {
    method: 'GET',
    headers: blobHeaders()
  });

  if (response.status === 404) {
    await blobPutJson(key, emptyValue);
    return structuredClone(emptyValue);
  }

  if (!response.ok) {
    throw new Error(`Blob read failed for ${key}: ${response.status}`);
  }

  return response.json();
}

async function blobPutJson(key, value) {
  const response = await fetch(`${blobBaseUrl()}/${key}`, {
    method: 'PUT',
    headers: blobHeaders(),
    body: JSON.stringify(value, null, 2)
  });

  if (!response.ok) {
    throw new Error(`Blob write failed for ${key}: ${response.status}`);
  }
}

export async function initStore() {
  if (getStoreMode() === 'blob') {
    await Promise.all([
      blobGetJson('queue.json', []),
      blobGetJson('audit.json', [])
    ]);
  }
}

export async function getQueue() {
  if (getStoreMode() === 'blob') {
    return blobGetJson('queue.json', []);
  }
  return structuredClone(memoryState.queue);
}

export async function saveQueue(items) {
  if (getStoreMode() === 'blob') {
    await blobPutJson('queue.json', items);
    return;
  }
  memoryState.queue = structuredClone(items);
}

export async function getAuditLog() {
  if (getStoreMode() === 'blob') {
    return blobGetJson('audit.json', []);
  }
  return structuredClone(memoryState.audit);
}

export async function appendAudit(entry) {
  const items = await getAuditLog();
  items.push(entry);
  if (getStoreMode() === 'blob') {
    await blobPutJson('audit.json', items);
    return;
  }
  memoryState.audit = items;
}

export function getStoreInfo() {
  return {
    mode: getStoreMode(),
    durable: getStoreMode() === 'blob'
  };
}
