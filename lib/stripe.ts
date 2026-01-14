import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// Payment method types available in Malaysia
export const PAYMENT_METHOD_TYPES: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
  'card',
  'grabpay',
]

// Format amount for Stripe (convert to cents/sen)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100)
}

// Format amount from Stripe (convert from cents/sen)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100
}
