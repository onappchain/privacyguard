export function json(response, status, payload) {
  response.status(status).json(payload);
}

export function methodNotAllowed(response, allowed) {
  response.setHeader('Allow', allowed.join(', '));
  return json(response, 405, { error: 'Method not allowed' });
}

export function parseBody(request) {
  if (!request.body) {
    return {};
  }
  if (typeof request.body === 'string') {
    return request.body ? JSON.parse(request.body) : {};
  }
  return request.body;
}

export function getBaseUrl(request) {
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const proto = request.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}
