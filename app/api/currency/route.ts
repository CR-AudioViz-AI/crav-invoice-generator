/**
 * INVOICE GENERATOR PRO - MULTI-CURRENCY API
 * Support for 50+ currencies with real-time exchange rates
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
// SUPPORTED CURRENCIES
// ============================================================================

const CURRENCIES: Record<string, { name: string; symbol: string; decimal_places: number }> = {
  // Major Currencies
  USD: { name: 'US Dollar', symbol: '$', decimal_places: 2 },
  EUR: { name: 'Euro', symbol: '€', decimal_places: 2 },
  GBP: { name: 'British Pound', symbol: '£', decimal_places: 2 },
  JPY: { name: 'Japanese Yen', symbol: '¥', decimal_places: 0 },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', decimal_places: 2 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', decimal_places: 2 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', decimal_places: 2 },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', decimal_places: 2 },
  
  // Asian Currencies
  CNY: { name: 'Chinese Yuan', symbol: '¥', decimal_places: 2 },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', decimal_places: 2 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', decimal_places: 2 },
  TWD: { name: 'Taiwan Dollar', symbol: 'NT$', decimal_places: 0 },
  KRW: { name: 'South Korean Won', symbol: '₩', decimal_places: 0 },
  INR: { name: 'Indian Rupee', symbol: '₹', decimal_places: 2 },
  THB: { name: 'Thai Baht', symbol: '฿', decimal_places: 2 },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM', decimal_places: 2 },
  PHP: { name: 'Philippine Peso', symbol: '₱', decimal_places: 2 },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp', decimal_places: 0 },
  VND: { name: 'Vietnamese Dong', symbol: '₫', decimal_places: 0 },
  
  // European Currencies
  SEK: { name: 'Swedish Krona', symbol: 'kr', decimal_places: 2 },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', decimal_places: 2 },
  DKK: { name: 'Danish Krone', symbol: 'kr', decimal_places: 2 },
  PLN: { name: 'Polish Zloty', symbol: 'zł', decimal_places: 2 },
  CZK: { name: 'Czech Koruna', symbol: 'Kč', decimal_places: 2 },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft', decimal_places: 0 },
  RON: { name: 'Romanian Leu', symbol: 'lei', decimal_places: 2 },
  BGN: { name: 'Bulgarian Lev', symbol: 'лв', decimal_places: 2 },
  HRK: { name: 'Croatian Kuna', symbol: 'kn', decimal_places: 2 },
  RUB: { name: 'Russian Ruble', symbol: '₽', decimal_places: 2 },
  UAH: { name: 'Ukrainian Hryvnia', symbol: '₴', decimal_places: 2 },
  TRY: { name: 'Turkish Lira', symbol: '₺', decimal_places: 2 },
  
  // Americas
  MXN: { name: 'Mexican Peso', symbol: 'MX$', decimal_places: 2 },
  BRL: { name: 'Brazilian Real', symbol: 'R$', decimal_places: 2 },
  ARS: { name: 'Argentine Peso', symbol: 'AR$', decimal_places: 2 },
  CLP: { name: 'Chilean Peso', symbol: 'CLP$', decimal_places: 0 },
  COP: { name: 'Colombian Peso', symbol: 'COL$', decimal_places: 0 },
  PEN: { name: 'Peruvian Sol', symbol: 'S/', decimal_places: 2 },
  
  // Middle East & Africa
  AED: { name: 'UAE Dirham', symbol: 'د.إ', decimal_places: 2 },
  SAR: { name: 'Saudi Riyal', symbol: '﷼', decimal_places: 2 },
  QAR: { name: 'Qatari Riyal', symbol: 'QR', decimal_places: 2 },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'KD', decimal_places: 3 },
  BHD: { name: 'Bahraini Dinar', symbol: 'BD', decimal_places: 3 },
  OMR: { name: 'Omani Rial', symbol: 'OMR', decimal_places: 3 },
  ILS: { name: 'Israeli Shekel', symbol: '₪', decimal_places: 2 },
  EGP: { name: 'Egyptian Pound', symbol: 'E£', decimal_places: 2 },
  ZAR: { name: 'South African Rand', symbol: 'R', decimal_places: 2 },
  NGN: { name: 'Nigerian Naira', symbol: '₦', decimal_places: 2 },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', decimal_places: 2 },
  
  // Crypto (for crypto-friendly invoicing)
  BTC: { name: 'Bitcoin', symbol: '₿', decimal_places: 8 },
  ETH: { name: 'Ethereum', symbol: 'Ξ', decimal_places: 8 },
  USDT: { name: 'Tether', symbol: 'USDT', decimal_places: 2 },
  USDC: { name: 'USD Coin', symbol: 'USDC', decimal_places: 2 },
};

// ============================================================================
// GET - List currencies or get exchange rate
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to');
    const amount = parseFloat(searchParams.get('amount') || '1');

    if (action === 'list') {
      // Return all supported currencies
      const currencies = Object.entries(CURRENCIES).map(([code, info]) => ({
        code,
        ...info,
      }));

      return NextResponse.json({
        currencies,
        total: currencies.length,
        popular: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'],
      });
    }

    if (action === 'rate' && to) {
      // Get exchange rate
      const rate = await getExchangeRate(from, to);
      const convertedAmount = amount * rate;

      return NextResponse.json({
        from,
        to,
        rate,
        amount,
        converted: convertedAmount,
        formatted: formatCurrency(convertedAmount, to),
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'rates') {
      // Get all rates for a base currency
      const rates = await getAllRates(from);

      return NextResponse.json({
        base: from,
        rates,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Currency API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// POST - Convert invoice to different currency
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
    const { invoice_id, target_currency, lock_rate } = body;

    if (!invoice_id || !target_currency) {
      return NextResponse.json({
        error: 'invoice_id and target_currency required'
      }, { status: 400 });
    }

    if (!CURRENCIES[target_currency]) {
      return NextResponse.json({
        error: `Unsupported currency: ${target_currency}`
      }, { status: 400 });
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const sourceCurrency = invoice.currency || 'USD';
    const rate = await getExchangeRate(sourceCurrency, target_currency);

    // Convert all amounts
    const convertedInvoice = {
      original_currency: sourceCurrency,
      original_subtotal: invoice.subtotal,
      original_tax_amount: invoice.tax_amount,
      original_discount_amount: invoice.discount_amount,
      original_total: invoice.total,
      
      currency: target_currency,
      subtotal: roundCurrency(invoice.subtotal * rate, target_currency),
      tax_amount: roundCurrency(invoice.tax_amount * rate, target_currency),
      discount_amount: roundCurrency(invoice.discount_amount * rate, target_currency),
      total: roundCurrency(invoice.total * rate, target_currency),
      
      exchange_rate: rate,
      rate_locked_at: lock_rate ? new Date().toISOString() : null,
      
      items: invoice.items.map((item: any) => ({
        ...item,
        original_rate: item.rate,
        original_amount: item.amount,
        rate: roundCurrency(item.rate * rate, target_currency),
        amount: roundCurrency(item.amount * rate, target_currency),
      })),
    };

    // Update invoice if requested
    if (body.save) {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          currency: target_currency,
          subtotal: convertedInvoice.subtotal,
          tax_amount: convertedInvoice.tax_amount,
          discount_amount: convertedInvoice.discount_amount,
          total: convertedInvoice.total,
          items: JSON.stringify(convertedInvoice.items),
          exchange_rate: rate,
          original_currency: sourceCurrency,
          original_total: invoice.total,
        })
        .eq('id', invoice_id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      success: true,
      converted_invoice: convertedInvoice,
      rate,
      message: `Converted from ${sourceCurrency} to ${target_currency} at rate ${rate.toFixed(6)}`,
    });

  } catch (error: any) {
    console.error('Currency conversion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// EXCHANGE RATE FUNCTIONS
// ============================================================================

async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  // Try to get cached rate first
  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate, updated_at')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .single();

  // Use cached rate if less than 1 hour old
  if (cached) {
    const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
    if (cacheAge < 60 * 60 * 1000) {
      return cached.rate;
    }
  }

  // Fetch fresh rate from API
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    
    if (!response.ok) {
      throw new Error('Exchange rate API error');
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      throw new Error(`Rate not available for ${from} to ${to}`);
    }

    // Cache the rate
    await supabase
      .from('exchange_rates')
      .upsert({
        from_currency: from,
        to_currency: to,
        rate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'from_currency,to_currency',
      });

    return rate;

  } catch (error) {
    // Fallback to cached rate if API fails
    if (cached) {
      return cached.rate;
    }
    throw error;
  }
}

async function getAllRates(base: string): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );
    
    if (!response.ok) {
      throw new Error('Exchange rate API error');
    }

    const data = await response.json();
    
    // Filter to only supported currencies
    const rates: Record<string, number> = {};
    for (const code of Object.keys(CURRENCIES)) {
      if (data.rates[code]) {
        rates[code] = data.rates[code];
      }
    }

    return rates;

  } catch (error) {
    // Return cached rates if API fails
    const { data: cached } = await supabase
      .from('exchange_rates')
      .select('to_currency, rate')
      .eq('from_currency', base);

    const rates: Record<string, number> = {};
    for (const row of cached || []) {
      rates[row.to_currency] = row.rate;
    }

    return rates;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function roundCurrency(amount: number, currency: string): number {
  const decimalPlaces = CURRENCIES[currency]?.decimal_places ?? 2;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(amount * factor) / factor;
}

function formatCurrency(amount: number, currency: string): string {
  const info = CURRENCIES[currency];
  if (!info) {
    return `${currency} ${amount.toFixed(2)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: info.decimal_places,
    maximumFractionDigits: info.decimal_places,
  }).format(amount);
}
