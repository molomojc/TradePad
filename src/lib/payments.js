const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const checkoutEndpoint = import.meta.env.VITE_LEMON_SQUEEZY_CHECKOUT_ENDPOINT || '/api/create-checkout-session';

export async function createCheckoutSession({ planSlug, successUrl, cancelUrl, userId, userEmail }) {
  const response = await fetch(`${apiBaseUrl}${checkoutEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planSlug,
      successUrl,
      cancelUrl,
      userId,
      userEmail,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Unable to create checkout session.');
  }

  return payload;
}

export function getPaymentSuccessUrl() {
  return `${window.location.origin}/payment/success`;
}

export function getPaymentCancelUrl() {
  return `${window.location.origin}/payment/cancelled`;
}
