import { json, methodNotAllowed, parseBody, getBaseUrl } from './lib/http.js';
import { createCheckoutSession } from './lib/stripe.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return methodNotAllowed(response, ['POST']);
  }

  try {
    const payload = parseBody(request);
    const baseUrl = process.env.PUBLIC_SITE_URL || getBaseUrl(request);
    const successUrl = `${baseUrl}/?checkout=success`;
    const cancelUrl = `${baseUrl}/?checkout=cancel`;
    const session = await createCheckoutSession({
      customerEmail: payload.email,
      successUrl,
      cancelUrl
    });

    return json(response, 200, {
      checkoutUrl: session.url,
      sessionId: session.id,
      priceId: 'price_1TO4GCLvqhX6oxTLH0HZ7A61'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return json(response, statusCode, { error: error.message || 'Checkout failed' });
  }
}
