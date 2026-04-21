function cleanString(value, maxLength = 500) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, maxLength);
}

function buildHandoffPayload(job) {
  return {
    source: 'privacyguard-site',
    submittedAt: new Date().toISOString(),
    handoff: {
      jobId: job.id,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      status: job.status,
      targetId: job.targetId,
      requestType: job.requestType,
      user: {
        name: cleanString(job.payload?.user?.name, 120),
        email: cleanString(job.payload?.user?.email, 200),
        state: cleanString(job.payload?.user?.state, 8).toUpperCase()
      },
      companyName: cleanString(job.payload?.companyName, 160),
      privacyEmail: cleanString(job.payload?.privacyEmail, 200),
      notes: cleanString(job.payload?.notes, 2000),
      result: {
        outcome: job.result?.outcome || '',
        message: cleanString(job.result?.message || '', 500),
        automationLevel: cleanString(job.result?.automationLevel || '', 80),
        actionUrl: cleanString(job.result?.actionUrl || '', 500),
        nextSteps: Array.isArray(job.result?.nextSteps)
          ? job.result.nextSteps.map((step) => cleanString(step, 240)).filter(Boolean).slice(0, 10)
          : []
      }
    }
  };
}

export async function dispatchPrivacyRequest(job) {
  const endpoint = process.env.PRIVACYGUARD_AGENT_DISPATCH_URL;

  if (!endpoint) {
    return {
      dispatched: false,
      mode: 'not_configured',
      message: 'Agent dispatch endpoint is not configured.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const secret = process.env.PRIVACYGUARD_AGENT_DISPATCH_SECRET;
  const payload = buildHandoffPayload(job);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const error = new Error(body?.error || `Dispatch failed with status ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }

    return {
      dispatched: true,
      mode: 'webhook',
      endpoint,
      payloadShape: 'source, submittedAt, handoff{jobId,status,targetId,requestType,user,companyName,privacyEmail,notes,result}',
      message: 'Privacy request dispatched to backend agent handoff endpoint.',
      response: body
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Dispatch timed out after 8000ms');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
