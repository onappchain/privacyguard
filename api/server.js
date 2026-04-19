import http from 'http';
import { randomUUID } from 'crypto';
import { getTargets } from './lib/registry.js';
import { appendAudit, getAuditLog, getQueue, initStore, saveQueue } from './lib/store.js';
import { runAdapter } from './lib/adapters.js';

initStore();

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  if (req.url === '/api/targets' && req.method === 'GET') {
    return send(res, 200, { targets: getTargets() });
  }

  if (req.url === '/api/queue' && req.method === 'GET') {
    return send(res, 200, { jobs: getQueue() });
  }

  if (req.url === '/api/audit' && req.method === 'GET') {
    return send(res, 200, { audit: getAuditLog() });
  }

  if (req.url === '/api/submit' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      if (!payload.targetId || !payload.requestType || !payload.user) {
        return send(res, 400, { error: 'targetId, requestType, and user are required' });
      }

      const now = new Date().toISOString();
      const job = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        status: 'queued',
        targetId: payload.targetId,
        requestType: payload.requestType,
        payload
      };

      const queue = getQueue();
      queue.push(job);
      saveQueue(queue);
      appendAudit({ id: randomUUID(), jobId: job.id, at: now, event: 'job_created', details: { targetId: job.targetId, requestType: job.requestType } });

      const adapterResult = runAdapter(job);
      job.status = adapterResult.outcome === 'unsupported' ? 'manual_review' : 'prepared';
      job.updatedAt = new Date().toISOString();
      job.result = adapterResult;
      saveQueue(queue);
      appendAudit({ id: randomUUID(), jobId: job.id, at: job.updatedAt, event: 'job_prepared', details: adapterResult });

      return send(res, 200, { job });
    } catch (error) {
      return send(res, 400, { error: 'Invalid JSON body' });
    }
  }

  return send(res, 404, { error: 'Not found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`PrivacyGuard filing agent listening on ${port}`);
});
