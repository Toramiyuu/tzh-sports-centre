import Stripe from 'stripe'

// Stripe is optional - only initialize if secret key is provided
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null

// Payment method types available in Malaysia
export const PAYMENT_METHOD_TYPES: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
  'card',
  'grabpay',
  'fpx', // FPX online banking (Malaysian banks including TNG-linked accounts)
]

// Format amount for Stripe (convert to cents/sen)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100)
}

// Format amount from Stripe (convert from cents/sen)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100
}
