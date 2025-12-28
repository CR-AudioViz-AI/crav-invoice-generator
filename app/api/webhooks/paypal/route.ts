/**
 * PAYPAL WEBHOOK HANDLER FOR INVOICE PAYMENTS
 * Automatically marks invoices as paid when PayPal payment succeeds
 * 
 * @version 1.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PayPal webhook verification
async function verifyPayPalWebhook(body: string, headers: Headers): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  if (!webhookId) {
    console.warn('PayPal webhook ID not configured');
    return true; // Skip verification in dev
  }

  try {
    const verifyPayload = {
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    };

    const tokenResponse = await fetch(
      `https://api-m.paypal.com/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      }
    );

    const { access_token } = await tokenResponse.json();

    const verifyResponse = await fetch(
      'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(verifyPayload)
      }
    );

    const result = await verifyResponse.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  
  // Verify webhook signature
  const isValid = await verifyPayPalWebhook(body, request.headers);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED':
    case 'PAYMENT.CAPTURE.COMPLETED': {
      await handlePaymentCompleted(event);
      break;
    }

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.DECLINED': {
      await handlePaymentFailed(event);
      break;
    }

    case 'PAYMENT.CAPTURE.REFUNDED': {
      await handleRefund(event);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentCompleted(event: any) {
  const resource = event.resource;
  const invoiceId = resource.custom_id || resource.invoice_id;
  
  if (!invoiceId) {
    console.log('No invoice ID in PayPal event');
    return;
  }

  const amountPaid = parseFloat(resource.amount?.value || resource.purchase_units?.[0]?.amount?.value || '0');
  const currency = resource.amount?.currency_code || 'USD';

  try {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return;
    }

    const newAmountPaid = (invoice.amount_paid || 0) + amountPaid;
    const newBalance = invoice.total - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    await supabase
      .from('invoices')
      .update({
        status: newStatus,
        amount_paid: newAmountPaid,
        balance_due: Math.max(0, newBalance),
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    await supabase.from('invoice_payments').insert({
      invoice_id: invoiceId,
      amount: amountPaid,
      currency,
      method: 'paypal',
      status: 'completed',
      transaction_id: resource.id,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    await supabase.from('activity_logs').insert({
      entity_type: 'invoice',
      entity_id: invoiceId,
      action: 'payment_received',
      details: JSON.stringify({
        amount: amountPaid,
        method: 'paypal',
        transaction_id: resource.id,
        new_status: newStatus
      }),
      created_at: new Date().toISOString()
    });

    console.log(`PayPal payment processed for invoice ${invoiceId}`);

  } catch (error) {
    console.error('PayPal payment processing error:', error);
  }
}

async function handlePaymentFailed(event: any) {
  const resource = event.resource;
  const invoiceId = resource.custom_id || resource.invoice_id;
  
  if (!invoiceId) return;

  await supabase.from('activity_logs').insert({
    entity_type: 'invoice',
    entity_id: invoiceId,
    action: 'payment_failed',
    details: JSON.stringify({
      method: 'paypal',
      error: resource.status_details?.reason || 'Payment failed'
    }),
    created_at: new Date().toISOString()
  });
}

async function handleRefund(event: any) {
  const resource = event.resource;
  const refundAmount = parseFloat(resource.amount?.value || '0');

  // Find original payment
  const { data: payment } = await supabase
    .from('invoice_payments')
    .select('invoice_id')
    .eq('transaction_id', resource.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop())
    .single();

  if (!payment) return;

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', payment.invoice_id)
    .single();

  if (invoice) {
    const newAmountPaid = Math.max(0, (invoice.amount_paid || 0) - refundAmount);
    
    await supabase
      .from('invoices')
      .update({
        status: newAmountPaid === 0 ? 'sent' : 'partial',
        amount_paid: newAmountPaid,
        balance_due: invoice.total - newAmountPaid,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.invoice_id);
  }

  await supabase.from('invoice_payments').insert({
    invoice_id: payment.invoice_id,
    amount: -refundAmount,
    currency: resource.amount?.currency_code || 'USD',
    method: 'paypal',
    status: 'refunded',
    transaction_id: resource.id,
    created_at: new Date().toISOString()
  });
}
