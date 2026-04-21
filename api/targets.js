import { json, methodNotAllowed } from './lib/http.js';
import { getTargets } from './lib/registry.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed(response, ['GET']);
  }

  return json(response, 200, { targets: getTargets() });
}
