/**
 * INVOICE GENERATOR PRO - RECURRING INVOICES API
 * Automatically generate invoices on schedule
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

interface RecurringInvoice {
  id?: string;
  user_id: string;
  client_id: string;
  template_invoice_id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  next_invoice_date: string;
  auto_send: boolean;
  is_active: boolean;
  invoices_generated: number;
  last_generated_at?: string;
  created_at?: string;
}

// ============================================================================
// CREATE RECURRING INVOICE
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
    const { 
      client_id, 
      template_invoice_id, 
      frequency, 
      start_date, 
      end_date, 
      auto_send = false 
    } = body;

    // Validate required fields
    if (!client_id || !template_invoice_id || !frequency || !start_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: client_id, template_invoice_id, frequency, start_date' 
      }, { status: 400 });
    }

    // Calculate next invoice date
    const nextInvoiceDate = calculateNextDate(new Date(start_date), frequency);

    // Create recurring invoice record
    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert({
        user_id: user.id,
        client_id,
        template_invoice_id,
        frequency,
        start_date,
        end_date,
        next_invoice_date: nextInvoiceDate.toISOString(),
        auto_send,
        is_active: true,
        invoices_generated: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      recurring_invoice: data,
      message: `Recurring invoice created. First invoice will be generated on ${nextInvoiceDate.toLocaleDateString()}`
    });

  } catch (error: any) {
    console.error('Recurring invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GET RECURRING INVOICES
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
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('recurring_invoices')
      .select(`
        *,
        client:clients(*),
        template:invoices(*)
      `)
      .eq('user_id', user.id)
      .order('next_invoice_date', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      recurring_invoices: data,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('Get recurring invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// UPDATE RECURRING INVOICE
// ============================================================================

export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recurring invoice ID required' }, { status: 400 });
    }

    // If frequency changed, recalculate next date
    if (updates.frequency) {
      const now = new Date();
      updates.next_invoice_date = calculateNextDate(now, updates.frequency).toISOString();
    }

    const { data, error } = await supabase
      .from('recurring_invoices')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      recurring_invoice: data
    });

  } catch (error: any) {
    console.error('Update recurring invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// DELETE RECURRING INVOICE
// ============================================================================

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Recurring invoice ID required' }, { status: 400 });
    }

    // Soft delete - just deactivate
    const { error } = await supabase
      .from('recurring_invoices')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Recurring invoice deactivated'
    });

  } catch (error: any) {
    console.error('Delete recurring invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateNextDate(fromDate: Date, frequency: string): Date {
  const next = new Date(fromDate);
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}
