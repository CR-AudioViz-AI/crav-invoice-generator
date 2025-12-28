/**
 * INVOICE REMINDER AUTOMATION API
 * Automatic reminders for upcoming and overdue invoices
 * 
 * Features:
 * - Upcoming due reminders (3 days before)
 * - Due today reminders
 * - Overdue reminders (1, 7, 14, 30 days)
 * - Auto-status update to 'overdue'
 * 
 * @version 1.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Reminder schedule (days relative to due date, negative = before due)
const REMINDER_SCHEDULE = [
  { days: -3, type: 'upcoming', subject: 'Invoice Due in 3 Days' },
  { days: 0, type: 'due_today', subject: 'Invoice Due Today' },
  { days: 1, type: 'overdue', subject: 'Invoice Overdue - Payment Required' },
  { days: 7, type: 'overdue', subject: 'Invoice 7 Days Overdue - Urgent' },
  { days: 14, type: 'overdue', subject: 'Invoice 14 Days Overdue - Final Notice' },
  { days: 30, type: 'overdue', subject: 'Invoice 30 Days Overdue - Collection Notice' },
];

// ============================================================================
// POST - Process reminders (called by cron job)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      processed: 0,
      reminders_sent: 0,
      status_updates: 0,
      errors: [] as string[]
    };

    // Get all sent invoices that haven't been paid
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['sent', 'overdue'])
      .not('to_email', 'is', null);

    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const invoice of invoices || []) {
      results.processed++;

      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Update status to overdue if past due
      if (daysDiff > 0 && invoice.status !== 'overdue') {
        await supabase
          .from('invoices')
          .update({ 
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);
        
        results.status_updates++;
      }

      // Check if reminder should be sent
      for (const reminder of REMINDER_SCHEDULE) {
        if (daysDiff === reminder.days) {
          // Check if reminder already sent
          const { data: existingReminder } = await supabase
            .from('invoice_reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('reminder_type', reminder.type)
            .eq('days_offset', reminder.days)
            .single();

          if (!existingReminder) {
            try {
              await sendReminder(invoice, reminder);
              
              // Record reminder
              await supabase.from('invoice_reminders').insert({
                invoice_id: invoice.id,
                reminder_type: reminder.type,
                days_offset: reminder.days,
                sent_at: new Date().toISOString()
              });

              // Update reminder count
              await supabase
                .from('invoices')
                .update({ 
                  reminder_count: (invoice.reminder_count || 0) + 1,
                  last_reminder_at: new Date().toISOString()
                })
                .eq('id', invoice.id);

              results.reminders_sent++;
            } catch (err: any) {
              results.errors.push(`Invoice ${invoice.invoice_number}: ${err.message}`);
            }
          }
        }
      }
    }

    // Log the run
    await supabase.from('activity_logs').insert({
      entity_type: 'system',
      entity_id: 'invoice_reminders',
      action: 'cron_run',
      details: JSON.stringify(results),
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error: any) {
    console.error('Reminder processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// Send Reminder Email
// ============================================================================

async function sendReminder(
  invoice: any, 
  reminder: { days: number; type: string; subject: string }
) {
  const isOverdue = reminder.type === 'overdue';
  const daysText = reminder.days === 0 
    ? 'today'
    : reminder.days < 0 
      ? `in ${Math.abs(reminder.days)} days`
      : `${reminder.days} days ago`;

  const urgencyColor = isOverdue ? '#dc2626' : '#f59e0b';
  const urgencyBg = isOverdue ? '#fef2f2' : '#fffbeb';

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$'
  };
  const symbol = currencySymbols[invoice.currency] || '$';
  const formattedAmount = `${symbol}${(invoice.balance_due || invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${urgencyColor}; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .alert-box { background: ${urgencyBg}; border: 2px solid ${urgencyColor}; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .amount { font-size: 36px; font-weight: bold; color: ${urgencyColor}; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .button { display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">${isOverdue ? '⚠️ Payment Overdue' : '⏰ Payment Reminder'}</h1>
      <p style="margin:10px 0 0;opacity:0.9;">Invoice ${invoice.invoice_number}</p>
    </div>
    <div class="content">
      <p>Dear ${invoice.to_name},</p>
      
      <div class="alert-box">
        <p style="margin:0;color:#6b7280;font-size:14px;">${isOverdue ? 'Amount Overdue' : 'Amount Due'}</p>
        <p class="amount">${formattedAmount}</p>
        <p style="margin:5px 0 0;color:${urgencyColor};font-weight:600;">
          ${isOverdue ? `Payment was due ${daysText}` : `Payment is due ${daysText}`}
        </p>
      </div>

      <div class="details">
        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p><strong>Due Date:</strong> ${invoice.due_date}</p>
        <p><strong>From:</strong> ${invoice.from_name}</p>
      </div>

      ${invoice.payment_link ? `
        <div style="text-align:center;margin-top:25px;">
          <a href="${invoice.payment_link}" class="button">Pay Now →</a>
        </div>
      ` : ''}

      <p style="margin-top:25px;color:#6b7280;font-size:14px;">
        ${isOverdue 
          ? 'Please make payment as soon as possible to avoid any additional fees or actions.'
          : 'Please ensure payment is made by the due date to avoid late fees.'}
      </p>

      <p style="color:#6b7280;font-size:14px;">
        If you have already made this payment, please disregard this reminder.
        For questions, please reply to this email.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated reminder from ${invoice.from_name}</p>
      <p>Powered by Invoice Generator Pro</p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: `${invoice.from_name} <reminders@craudiovizai.com>`,
    to: [invoice.to_email],
    subject: `${reminder.subject} - ${invoice.invoice_number}`,
    html: html
  });
}

// ============================================================================
// GET - Manual trigger / status check
// ============================================================================

export async function GET(request: NextRequest) {
  // Get reminder stats
  const { data: pendingReminders } = await supabase
    .from('invoices')
    .select('id, invoice_number, due_date, status, reminder_count')
    .in('status', ['sent', 'overdue'])
    .order('due_date', { ascending: true });

  const { data: recentReminders } = await supabase
    .from('invoice_reminders')
    .select('*, invoices(invoice_number)')
    .order('sent_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    pending_invoices: pendingReminders?.length || 0,
    recent_reminders: recentReminders,
    schedule: REMINDER_SCHEDULE
  });
}
