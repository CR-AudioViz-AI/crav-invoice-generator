import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, amount, currency, description, customerEmail } = await request.json()
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    
    // Convert to cents for Stripe (most currencies)
    const amountInCents = Math.round(amount * 100)
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || `Invoice Payment`,
              description: `Payment for ${invoiceId || 'invoice'}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/payment-success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/payment-cancelled?invoice_id=${invoiceId}`,
      customer_email: customerEmail,
      metadata: {
        invoice_id: invoiceId,
        source: 'invoice_generator'
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoiceId
        }
      }
    })
    
    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })
  } catch (error: any) {
    console.error('Payment link creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
