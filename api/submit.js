import { json, methodNotAllowed, parseBody } from './lib/http.js';
import { createSubmission } from './lib/submit.js';
import { dispatchPrivacyRequest } from './lib/dispatch.js';
import { appendAudit, initStore } from './lib/store.js';
import { randomUUID } from 'crypto';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return methodNotAllowed(response, ['POST']);
  }

  try {
    await initStore();
    const payload = parseBody(request);
    const job = await createSubmission(payload);
    const dispatch = await dispatchPrivacyRequest(job);

    await appendAudit({
      id: randomUUID(),
      jobId: job.id,
      at: new Date().toISOString(),
      event: dispatch.dispatched ? 'job_dispatched' : 'job_dispatch_skipped',
      details: dispatch
    });

    return json(response, 200, { job, dispatch });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return json(response, statusCode, { error: error.message || 'Submission failed' });
  }
}
