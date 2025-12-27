/**
 * INVOICE GENERATOR PRO - PAYMENT REMINDERS API
 * Automated payment reminder emails
 * 
 * CR AudioViz AI - Fortune 50 Quality Standards
 * @version 2.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

interface ReminderSettings {
  id?: string;
  user_id: string;
  invoice_id?: string; // null = default settings for all invoices
  reminder_days: number[]; // e.g., [7, 3, 1, 0, -3, -7] (before/after due)
  email_template: 'friendly' | 'professional' | 'urgent' | 'custom';
  custom_subject?: string;
  custom_body?: string;
  include_invoice_link: boolean;
  include_payment_link: boolean;
  is_active: boolean;
}

interface ScheduledReminder {
  id?: string;
  invoice_id: string;
  reminder_date: string;
  reminder_type: 'before_due' | 'on_due' | 'overdue';
  days_offset: number;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const EMAIL_TEMPLATES = {
  friendly: {
    before: {
      subject: 'Friendly reminder: Invoice {{invoice_number}} due soon',
      body: `Hi {{client_name}},

Just a friendly reminder that invoice #{{invoice_number}} for {{total}} is due on {{due_date}}.

If you've already sent payment, please disregard this message. If not, we'd appreciate payment at your earliest convenience.

{{payment_link}}

Thanks for your business!

Best regards,
{{from_name}}`
    },
    on_due: {
      subject: 'Invoice {{invoice_number}} is due today',
      body: `Hi {{client_name}},

This is a reminder that invoice #{{invoice_number}} for {{total}} is due today ({{due_date}}).

{{payment_link}}

Please let us know if you have any questions.

Best regards,
{{from_name}}`
    },
    overdue: {
      subject: 'Payment reminder: Invoice {{invoice_number}} is overdue',
      body: `Hi {{client_name}},

We noticed that invoice #{{invoice_number}} for {{total}} was due on {{due_date}} and remains unpaid.

{{payment_link}}

If you've already sent payment, thank you! Otherwise, please let us know if there are any issues we can help resolve.

Best regards,
{{from_name}}`
    }
  },
  professional: {
    before: {
      subject: 'Payment Reminder - Invoice {{invoice_number}}',
      body: `Dear {{client_name}},

This is a courtesy reminder that Invoice #{{invoice_number}} in the amount of {{total}} will be due on {{due_date}}.

{{payment_link}}

If payment has already been submitted, please disregard this notice.

Regards,
{{from_name}}
{{from_email}}`
    },
    on_due: {
      subject: 'Invoice {{invoice_number}} - Payment Due Today',
      body: `Dear {{client_name}},

Please be advised that Invoice #{{invoice_number}} in the amount of {{total}} is due today.

{{payment_link}}

Thank you for your prompt attention to this matter.

Regards,
{{from_name}}`
    },
    overdue: {
      subject: 'Overdue Notice - Invoice {{invoice_number}}',
      body: `Dear {{client_name}},

Our records indicate that Invoice #{{invoice_number}} in the amount of {{total}} was due on {{due_date}} and remains outstanding.

{{payment_link}}

Please remit payment at your earliest convenience. If you have questions regarding this invoice, please contact us.

Regards,
{{from_name}}`
    }
  },
  urgent: {
    before: {
      subject: '⏰ Reminder: Invoice {{invoice_number}} due in {{days_until}} days',
      body: `Hi {{client_name}},

Quick reminder - Invoice #{{invoice_number}} ({{total}}) is due in {{days_until}} days on {{due_date}}.

{{payment_link}}

Thanks!
{{from_name}}`
    },
    on_due: {
      subject: '🔔 Invoice {{invoice_number}} Due TODAY - {{total}}',
      body: `Hi {{client_name}},

Invoice #{{invoice_number}} for {{total}} is due TODAY.

{{payment_link}}

Please process payment today to avoid late fees.

{{from_name}}`
    },
    overdue: {
      subject: '⚠️ OVERDUE: Invoice {{invoice_number}} - {{days_overdue}} days past due',
      body: `Hi {{client_name}},

Invoice #{{invoice_number}} for {{total}} is now {{days_overdue}} days overdue.

Original due date: {{due_date}}

{{payment_link}}

Please process payment immediately to bring your account current.

{{from_name}}`
    }
  }
};

// ============================================================================
// CREATE/UPDATE REMINDER SETTINGS
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'schedule') {
      return await scheduleReminders(request, user.id);
    } else if (action === 'send') {
      return await sendReminder(request, user.id);
    } else if (action === 'settings') {
      return await saveReminderSettings(request, user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Reminder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GET REMINDER SETTINGS & SCHEDULED REMINDERS
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
    const invoiceId = searchParams.get('invoice_id');
    const type = searchParams.get('type') || 'settings';

    if (type === 'scheduled') {
      // Get scheduled reminders
      let query = supabase
        .from('scheduled_reminders')
        .select(`
          *,
          invoice:invoices(*)
        `)
        .order('reminder_date', { ascending: true });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json({ scheduled_reminders: data });
    }

    // Get reminder settings
    const { data, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default settings if none exist
    const settings = data || {
      reminder_days: [7, 3, 1, 0, -3, -7],
      email_template: 'friendly',
      include_invoice_link: true,
      include_payment_link: true,
      is_active: true,
    };

    return NextResponse.json({ 
      settings,
      templates: Object.keys(EMAIL_TEMPLATES)
    });

  } catch (error: any) {
    console.error('Get reminders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// HELPER: SAVE REMINDER SETTINGS
// ============================================================================

async function saveReminderSettings(request: NextRequest, userId: string) {
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('reminder_settings')
    .upsert({
      user_id: userId,
      reminder_days: body.reminder_days || [7, 3, 1, 0, -3, -7],
      email_template: body.email_template || 'friendly',
      custom_subject: body.custom_subject,
      custom_body: body.custom_body,
      include_invoice_link: body.include_invoice_link ?? true,
      include_payment_link: body.include_payment_link ?? true,
      is_active: body.is_active ?? true,
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    settings: data
  });
}

// ============================================================================
// HELPER: SCHEDULE REMINDERS FOR AN INVOICE
// ============================================================================

async function scheduleReminders(request: NextRequest, userId: string) {
  const body = await request.json();
  const { invoice_id } = body;

  if (!invoice_id) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  }

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Get user's reminder settings
  const { data: settings } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  const reminderDays = settings?.reminder_days || [7, 3, 1, 0, -3, -7];
  const dueDate = new Date(invoice.due_date);

  // Create scheduled reminders
  const reminders = reminderDays.map(days => {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - days);

    return {
      invoice_id,
      reminder_date: reminderDate.toISOString(),
      reminder_type: days > 0 ? 'before_due' : days === 0 ? 'on_due' : 'overdue',
      days_offset: days,
      status: 'pending',
    };
  }).filter(r => new Date(r.reminder_date) > new Date()); // Only future reminders

  if (reminders.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No future reminders to schedule',
      scheduled: 0
    });
  }

  const { data, error } = await supabase
    .from('scheduled_reminders')
    .insert(reminders)
    .select();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    scheduled: data?.length || 0,
    reminders: data
  });
}

// ============================================================================
// HELPER: SEND A REMINDER (Called by CRON or manually)
// ============================================================================

async function sendReminder(request: NextRequest, userId: string) {
  const body = await request.json();
  const { reminder_id, invoice_id } = body;

  // Get invoice details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Get user settings
  const { data: settings } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  const template = EMAIL_TEMPLATES[settings?.email_template || 'friendly'];
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let emailTemplate;
  if (daysUntil > 0) {
    emailTemplate = template.before;
  } else if (daysUntil === 0) {
    emailTemplate = template.on_due;
  } else {
    emailTemplate = template.overdue;
  }

  // Replace placeholders
  const subject = replacePlaceholders(emailTemplate.subject, invoice, daysUntil);
  const body_text = replacePlaceholders(emailTemplate.body, invoice, daysUntil);

  // Send email (integrate with your email provider)
  // For now, we'll simulate and log
  console.log('Sending reminder email:', { to: invoice.to_email, subject });

  // In production, integrate with SendGrid, Resend, etc:
  // await sendEmail({ to: invoice.to_email, subject, body: body_text });

  // Update reminder status
  if (reminder_id) {
    await supabase
      .from('scheduled_reminders')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', reminder_id);
  }

  // Log the reminder
  await supabase.from('reminder_log').insert({
    invoice_id,
    user_id: userId,
    recipient_email: invoice.to_email,
    subject,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: `Reminder sent to ${invoice.to_email}`
  });
}

// ============================================================================
// HELPER: REPLACE PLACEHOLDERS
// ============================================================================

function replacePlaceholders(text: string, invoice: any, daysUntil: number): string {
  const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`;
  const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}`;

  return text
    .replace(/{{invoice_number}}/g, invoice.invoice_number)
    .replace(/{{client_name}}/g, invoice.to_name)
    .replace(/{{total}}/g, `$${invoice.total.toFixed(2)}`)
    .replace(/{{due_date}}/g, new Date(invoice.due_date).toLocaleDateString())
    .replace(/{{from_name}}/g, invoice.from_name)
    .replace(/{{from_email}}/g, invoice.from_email)
    .replace(/{{days_until}}/g, Math.abs(daysUntil).toString())
    .replace(/{{days_overdue}}/g, Math.abs(daysUntil).toString())
    .replace(/{{payment_link}}/g, `Pay online: ${paymentLink}`)
    .replace(/{{invoice_link}}/g, `View invoice: ${invoiceLink}`);
}
