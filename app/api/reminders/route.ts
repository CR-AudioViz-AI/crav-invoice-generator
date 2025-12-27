/**
 * INVOICE GENERATOR PRO - PAYMENT REMINDERS API
 * Automated payment reminders with smart scheduling
 * 
 * CR AudioViz AI - Fortune 50 Quality Standards
 * @version 2.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

interface ReminderSchedule {
  id?: string;
  user_id: string;
  name: string;
  is_default: boolean;
  reminders: ReminderConfig[];
  created_at?: string;
}

interface ReminderConfig {
  days_offset: number; // Negative = before due, Positive = after due
  subject_template: string;
  body_template: string;
  enabled: boolean;
}

interface SentReminder {
  id?: string;
  invoice_id: string;
  reminder_type: string;
  sent_at: string;
  recipient_email: string;
  status: 'sent' | 'failed' | 'opened' | 'clicked';
  opened_at?: string;
}

// Default reminder templates
const DEFAULT_REMINDERS: ReminderConfig[] = [
  {
    days_offset: -7,
    subject_template: 'Upcoming Invoice Due: {{invoice_number}}',
    body_template: `Hi {{client_name}},

This is a friendly reminder that Invoice {{invoice_number}} for {{total}} is due on {{due_date}}.

You can view and pay your invoice here: {{invoice_link}}

Thank you for your business!

Best regards,
{{from_name}}`,
    enabled: true,
  },
  {
    days_offset: -1,
    subject_template: 'Invoice Due Tomorrow: {{invoice_number}}',
    body_template: `Hi {{client_name}},

Just a quick reminder that Invoice {{invoice_number}} for {{total}} is due tomorrow ({{due_date}}).

Pay now: {{invoice_link}}

Thank you!

Best regards,
{{from_name}}`,
    enabled: true,
  },
  {
    days_offset: 0,
    subject_template: 'Invoice Due Today: {{invoice_number}}',
    body_template: `Hi {{client_name}},

Invoice {{invoice_number}} for {{total}} is due today.

Please make your payment at your earliest convenience: {{invoice_link}}

Thank you for your prompt attention!

Best regards,
{{from_name}}`,
    enabled: true,
  },
  {
    days_offset: 3,
    subject_template: 'Payment Overdue: Invoice {{invoice_number}}',
    body_template: `Hi {{client_name}},

This is a reminder that Invoice {{invoice_number}} for {{total}} was due on {{due_date}} and is now 3 days overdue.

Please make your payment as soon as possible: {{invoice_link}}

If you've already paid, please disregard this message.

Thank you,
{{from_name}}`,
    enabled: true,
  },
  {
    days_offset: 7,
    subject_template: 'Second Notice: Invoice {{invoice_number}} Overdue',
    body_template: `Hi {{client_name}},

This is our second notice regarding Invoice {{invoice_number}} for {{total}}, which was due on {{due_date}}.

The invoice is now 7 days overdue. Please make your payment immediately to avoid any late fees.

Pay now: {{invoice_link}}

If you have any questions or concerns about this invoice, please contact us.

Thank you,
{{from_name}}`,
    enabled: true,
  },
  {
    days_offset: 14,
    subject_template: 'Final Notice: Invoice {{invoice_number}} - Immediate Payment Required',
    body_template: `Hi {{client_name}},

FINAL NOTICE

Invoice {{invoice_number}} for {{total}} is now 14 days overdue.

This is our final reminder before we take additional collection measures. Please make your payment immediately.

Pay now: {{invoice_link}}

If there are any issues preventing payment, please contact us immediately to discuss.

{{from_name}}`,
    enabled: true,
  },
];

// ============================================================================
// GET - List reminder schedules and sent reminders
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'schedules';
    const invoiceId = searchParams.get('invoice_id');

    if (type === 'sent' && invoiceId) {
      // Get sent reminders for a specific invoice
      const { data, error } = await supabase
        .from('sent_reminders')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ sent_reminders: data || [] });
    }

    // Get reminder schedules
    const { data, error } = await supabase
      .from('reminder_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // If no schedules exist, return default
    if (!data || data.length === 0) {
      return NextResponse.json({
        schedules: [{
          id: 'default',
          name: 'Default Schedule',
          is_default: true,
          reminders: DEFAULT_REMINDERS,
        }],
        is_using_default: true,
      });
    }

    return NextResponse.json({ schedules: data });

  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// POST - Create reminder schedule or send manual reminder
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'send_reminder') {
      return await sendManualReminder(user.id, body);
    }

    if (action === 'create_schedule') {
      return await createReminderSchedule(user.id, body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in reminder action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// SEND MANUAL REMINDER
// ============================================================================

async function sendManualReminder(userId: string, body: any) {
  const { invoice_id, reminder_type, custom_message } = body;

  if (!invoice_id) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  }

  // Get invoice details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('user_id', userId)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Find the appropriate reminder template
  const reminderConfig = DEFAULT_REMINDERS.find(r => {
    if (reminder_type === 'upcoming') return r.days_offset === -7;
    if (reminder_type === 'due_tomorrow') return r.days_offset === -1;
    if (reminder_type === 'due_today') return r.days_offset === 0;
    if (reminder_type === 'overdue') return r.days_offset === 3;
    if (reminder_type === 'final') return r.days_offset === 14;
    return false;
  }) || DEFAULT_REMINDERS[0];

  // Process template
  const subject = processTemplate(reminderConfig.subject_template, invoice);
  const body_content = custom_message || processTemplate(reminderConfig.body_template, invoice);

  // Queue email
  const { error: queueError } = await supabase.from('email_queue').insert({
    type: 'reminder',
    recipient_email: invoice.to_email,
    subject,
    body: body_content,
    invoice_id,
    scheduled_for: new Date().toISOString(),
    status: 'pending',
  });

  if (queueError) throw queueError;

  // Log sent reminder
  await supabase.from('sent_reminders').insert({
    invoice_id,
    reminder_type,
    sent_at: new Date().toISOString(),
    recipient_email: invoice.to_email,
    status: 'sent',
  });

  return NextResponse.json({
    success: true,
    message: `Reminder sent to ${invoice.to_email}`,
  });
}

// ============================================================================
// CREATE REMINDER SCHEDULE
// ============================================================================

async function createReminderSchedule(userId: string, body: any) {
  const { name, reminders, is_default } = body;

  if (!name || !reminders) {
    return NextResponse.json({
      error: 'Name and reminders array required'
    }, { status: 400 });
  }

  // If setting as default, unset other defaults
  if (is_default) {
    await supabase
      .from('reminder_schedules')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('reminder_schedules')
    .insert({
      user_id: userId,
      name,
      reminders,
      is_default: is_default || false,
    })
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    schedule: data,
    message: 'Reminder schedule created',
  });
}

// ============================================================================
// PUT - CRON JOB - Process automated reminders
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Get all pending/overdue invoices
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        reminder_schedule:reminder_schedules(reminders)
      `)
      .in('status', ['pending', 'overdue'])
      .eq('reminders_enabled', true);

    if (invoiceError) throw invoiceError;

    const results = {
      processed: 0,
      reminders_sent: 0,
      errors: [] as string[],
    };

    for (const invoice of invoices || []) {
      try {
        const dueDate = parseISO(invoice.due_date);
        const daysDiff = differenceInDays(today, dueDate);

        // Get reminder schedule (use default if none set)
        const reminders = invoice.reminder_schedule?.reminders || DEFAULT_REMINDERS;

        // Find applicable reminder
        const applicableReminder = reminders.find((r: ReminderConfig) => 
          r.enabled && r.days_offset === daysDiff
        );

        if (!applicableReminder) {
          continue; // No reminder needed today
        }

        // Check if this reminder was already sent
        const { data: alreadySent } = await supabase
          .from('sent_reminders')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', `day_${daysDiff}`)
          .single();

        if (alreadySent) {
          continue; // Already sent this reminder
        }

        // Send reminder
        const subject = processTemplate(applicableReminder.subject_template, invoice);
        const body = processTemplate(applicableReminder.body_template, invoice);

        await supabase.from('email_queue').insert({
          type: 'reminder',
          recipient_email: invoice.to_email,
          subject,
          body,
          invoice_id: invoice.id,
          scheduled_for: new Date().toISOString(),
          status: 'pending',
        });

        await supabase.from('sent_reminders').insert({
          invoice_id: invoice.id,
          reminder_type: `day_${daysDiff}`,
          sent_at: new Date().toISOString(),
          recipient_email: invoice.to_email,
          status: 'sent',
        });

        results.reminders_sent++;

        // Update invoice status to overdue if past due
        if (daysDiff > 0 && invoice.status !== 'overdue') {
          await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('id', invoice.id);
        }

      } catch (err: any) {
        results.errors.push(`Invoice ${invoice.id}: ${err.message}`);
      }

      results.processed++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} invoices, sent ${results.reminders_sent} reminders`,
      results,
    });

  } catch (error: any) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// TEMPLATE PROCESSING
// ============================================================================

function processTemplate(template: string, invoice: any): string {
  const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}`;
  
  return template
    .replace(/\{\{invoice_number\}\}/g, invoice.invoice_number)
    .replace(/\{\{client_name\}\}/g, invoice.to_name)
    .replace(/\{\{total\}\}/g, formatCurrency(invoice.total, invoice.currency))
    .replace(/\{\{due_date\}\}/g, format(parseISO(invoice.due_date), 'MMMM d, yyyy'))
    .replace(/\{\{invoice_link\}\}/g, invoiceLink)
    .replace(/\{\{from_name\}\}/g, invoice.from_name)
    .replace(/\{\{from_email\}\}/g, invoice.from_email);
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
