/**
 * INVOICE GENERATOR PRO - EXPENSE TRACKING API
 * Track expenses and integrate with invoices for profit calculation
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
// EXPENSE CATEGORIES
// ============================================================================

const EXPENSE_CATEGORIES = [
  { id: 'supplies', name: 'Office Supplies', icon: '📦' },
  { id: 'software', name: 'Software & Subscriptions', icon: '💻' },
  { id: 'travel', name: 'Travel & Transportation', icon: '✈️' },
  { id: 'meals', name: 'Meals & Entertainment', icon: '🍽️' },
  { id: 'utilities', name: 'Utilities', icon: '💡' },
  { id: 'rent', name: 'Rent & Lease', icon: '🏢' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'marketing', name: 'Marketing & Advertising', icon: '📢' },
  { id: 'professional', name: 'Professional Services', icon: '👔' },
  { id: 'equipment', name: 'Equipment & Hardware', icon: '🔧' },
  { id: 'taxes', name: 'Taxes & Fees', icon: '📋' },
  { id: 'banking', name: 'Banking & Finance', icon: '🏦' },
  { id: 'education', name: 'Education & Training', icon: '📚' },
  { id: 'contractor', name: 'Contractor Payments', icon: '🤝' },
  { id: 'other', name: 'Other', icon: '📎' },
];

// ============================================================================
// CREATE EXPENSE
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
      description,
      amount,
      category,
      expense_date,
      vendor,
      receipt_url,
      project_id,
      client_id,
      invoice_id,
      is_billable,
      is_reimbursable,
      payment_method,
      notes,
      tax_deductible,
      currency,
    } = body;

    if (!description || !amount || !category || !expense_date) {
      return NextResponse.json({ 
        error: 'Required: description, amount, category, expense_date' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        description,
        amount: parseFloat(amount),
        category,
        expense_date,
        vendor,
        receipt_url,
        project_id,
        client_id,
        invoice_id,
        is_billable: is_billable || false,
        is_reimbursable: is_reimbursable || false,
        is_reimbursed: false,
        payment_method: payment_method || 'cash',
        notes,
        tax_deductible: tax_deductible ?? true,
        currency: currency || 'USD',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      expense: data
    });

  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GET EXPENSES
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
    const action = searchParams.get('action');

    if (action === 'categories') {
      return NextResponse.json({ categories: EXPENSE_CATEGORIES });
    }

    if (action === 'summary') {
      return await getExpenseSummary(user.id, searchParams);
    }

    // Get expenses with filters
    const category = searchParams.get('category');
    const clientId = searchParams.get('client_id');
    const projectId = searchParams.get('project_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const billableOnly = searchParams.get('billable') === 'true';
    const status = searchParams.get('status');

    let query = supabase
      .from('expenses')
      .select(`
        *,
        client:clients(name, company),
        invoice:invoices(invoice_number)
      `)
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });

    if (category) query = query.eq('category', category);
    if (clientId) query = query.eq('client_id', clientId);
    if (projectId) query = query.eq('project_id', projectId);
    if (startDate) query = query.gte('expense_date', startDate);
    if (endDate) query = query.lte('expense_date', endDate);
    if (billableOnly) query = query.eq('is_billable', true);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    // Calculate totals
    const totals = {
      total: 0,
      billable: 0,
      tax_deductible: 0,
      reimbursable: 0,
      by_category: {} as Record<string, number>,
    };

    data?.forEach(exp => {
      totals.total += exp.amount;
      if (exp.is_billable) totals.billable += exp.amount;
      if (exp.tax_deductible) totals.tax_deductible += exp.amount;
      if (exp.is_reimbursable && !exp.is_reimbursed) totals.reimbursable += exp.amount;
      
      totals.by_category[exp.category] = (totals.by_category[exp.category] || 0) + exp.amount;
    });

    return NextResponse.json({
      expenses: data,
      count: data?.length || 0,
      totals
    });

  } catch (error: any) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// UPDATE EXPENSE
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
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      expense: data
    });

  } catch (error: any) {
    console.error('Update expense error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// DELETE EXPENSE
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
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Expense deleted'
    });

  } catch (error: any) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// EXPENSE SUMMARY
// ============================================================================

async function getExpenseSummary(userId: string, searchParams: URLSearchParams) {
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month');

  let startDate: string, endDate: string;

  if (month) {
    startDate = `${year}-${month.padStart(2, '0')}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
  } else {
    startDate = `${year}-01-01`;
    endDate = `${parseInt(year) + 1}-01-01`;
  }

  // Get expenses for period
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lt('expense_date', endDate);

  // Get invoices for same period (for profit calculation)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('user_id', userId)
    .gte('invoice_date', startDate)
    .lt('invoice_date', endDate);

  // Calculate summaries
  const summary = {
    period: month ? `${year}-${month}` : year,
    expenses: {
      total: 0,
      by_category: {} as Record<string, number>,
      by_month: {} as Record<string, number>,
      billable: 0,
      tax_deductible: 0,
    },
    income: {
      invoiced: 0,
      paid: 0,
    },
    profit: {
      gross: 0,
      net: 0,
      margin: 0,
    }
  };

  expenses?.forEach(exp => {
    summary.expenses.total += exp.amount;
    summary.expenses.by_category[exp.category] = 
      (summary.expenses.by_category[exp.category] || 0) + exp.amount;
    
    const expMonth = exp.expense_date.substring(0, 7);
    summary.expenses.by_month[expMonth] = 
      (summary.expenses.by_month[expMonth] || 0) + exp.amount;

    if (exp.is_billable) summary.expenses.billable += exp.amount;
    if (exp.tax_deductible) summary.expenses.tax_deductible += exp.amount;
  });

  invoices?.forEach(inv => {
    summary.income.invoiced += inv.total;
    if (inv.status === 'paid') {
      summary.income.paid += inv.total;
    }
  });

  summary.profit.gross = summary.income.paid;
  summary.profit.net = summary.income.paid - summary.expenses.total;
  summary.profit.margin = summary.income.paid > 0 
    ? (summary.profit.net / summary.income.paid) * 100 
    : 0;

  // Add category details
  const categoryDetails = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    amount: summary.expenses.by_category[cat.id] || 0,
    percentage: summary.expenses.total > 0 
      ? ((summary.expenses.by_category[cat.id] || 0) / summary.expenses.total) * 100 
      : 0
  })).filter(cat => cat.amount > 0).sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    summary,
    category_breakdown: categoryDetails,
    monthly_breakdown: Object.entries(summary.expenses.by_month)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
  });
}
