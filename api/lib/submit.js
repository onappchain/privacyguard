import { randomUUID } from 'crypto';
import { appendAudit, getQueue, saveQueue } from './store.js';
import { runAdapter } from './adapters.js';
import { getTargetById } from './registry.js';

function validatePayload(payload) {
  if (!payload?.targetId || !payload?.requestType || !payload?.user?.name || !payload?.user?.email || !payload?.user?.state) {
    return 'targetId, requestType, user.name, user.email, and user.state are required';
  }

  const target = getTargetById(payload.targetId);
  if (!target) {
    return 'Unsupported targetId';
  }

  if (!(target.supports || []).includes(payload.requestType)) {
    return 'Request type is not supported for this target';
  }

  return null;
}

export async function createSubmission(payload) {
  const validationError = validatePayload(payload);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
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

  const queue = await getQueue();
  queue.push(job);
  await saveQueue(queue);
  await appendAudit({
    id: randomUUID(),
    jobId: job.id,
    at: now,
    event: 'job_created',
    details: {
      targetId: job.targetId,
      requestType: job.requestType,
      userEmail: payload.user.email
    }
  });

  const adapterResult = runAdapter(job);
  job.status = adapterResult.outcome === 'unsupported' ? 'manual_review' : 'prepared';
  job.updatedAt = new Date().toISOString();
  job.result = adapterResult;
  await saveQueue(queue);
  await appendAudit({
    id: randomUUID(),
    jobId: job.id,
    at: job.updatedAt,
    event: 'job_prepared',
    details: adapterResult
  });

  return job;
}
