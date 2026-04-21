import { json, methodNotAllowed } from './lib/http.js';
import { getAuditLog, getStoreInfo, initStore } from './lib/store.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed(response, ['GET']);
  }

  await initStore();
  const audit = await getAuditLog();
  return json(response, 200, { audit, store: getStoreInfo() });
}
