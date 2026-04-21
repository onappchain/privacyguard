import { json, methodNotAllowed } from './lib/http.js';
import { getQueue, initStore, getStoreInfo } from './lib/store.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed(response, ['GET']);
  }

  await initStore();
  const jobs = await getQueue();
  return json(response, 200, { jobs, store: getStoreInfo() });
}
