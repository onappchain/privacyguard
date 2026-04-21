function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const error = new Error('Missing STRIPE_SECRET_KEY');
    error.statusCode = 500;
    throw error;
  }
  return key;
}

export async function createCheckoutSession({ customerEmail, successUrl, cancelUrl }) {
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('line_items[0][price]', 'price_1TO4GCLvqhX6oxTLH0HZ7A61');
  params.set('line_items[0][quantity]', '1');
  params.set('allow_promotion_codes', 'true');

  if (customerEmail) {
    params.set('customer_email', customerEmail);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Stripe checkout session creation failed');
    error.statusCode = response.status;
    throw error;
  }

  return data;
}
