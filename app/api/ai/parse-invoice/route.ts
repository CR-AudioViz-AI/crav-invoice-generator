/**
 * AI INVOICE PARSER API
 * Converts natural language to structured invoice data
 * 
 * Examples:
 * - "Invoice John $500 for web design"
 * - "Bill Acme Corp 10 hours at $100/hr for consulting"
 * - "Create invoice for logo design $1200, due next Friday"
 * 
 * @version 1.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';

// Use Groq for fast, free inference
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ParsedInvoice {
  clientName?: string;
  clientEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  dueDate?: string;
  notes?: string;
  currency?: string;
  taxRate?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { text, clients, businessName } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Build the prompt
    const systemPrompt = `You are an invoice parsing assistant. Extract invoice information from natural language text.

Available clients: ${clients?.join(', ') || 'None'}
Business: ${businessName || 'Unknown'}

Return a JSON object with this structure:
{
  "clientName": "string or null",
  "clientEmail": "string or null", 
  "items": [
    {
      "description": "string",
      "quantity": number,
      "rate": number,
      "amount": number (quantity * rate)
    }
  ],
  "dueDate": "YYYY-MM-DD or null",
  "notes": "string or null",
  "currency": "USD",
  "taxRate": number or 0
}

Rules:
1. Extract client name if mentioned (match to available clients if possible)
2. Parse all line items with descriptions and amounts
3. For hourly work, calculate quantity (hours) × rate
4. For monthly retainers, calculate quantity (months) × rate
5. Parse due dates relative to today: ${new Date().toISOString().split('T')[0]}
6. Default currency is USD unless specified
7. Return ONLY valid JSON, no other text`;

    const userPrompt = `Parse this invoice request: "${text}"`;

    // Try Groq first (free and fast)
    let parsed: ParsedInvoice | null = null;

    if (GROQ_API_KEY) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          })
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            parsed = JSON.parse(content);
          }
        }
      } catch (groqError) {
        console.error('Groq parsing error:', groqError);
      }
    }

    // Fallback to OpenAI if Groq fails
    if (!parsed && OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          })
        });

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            parsed = JSON.parse(content);
          }
        }
      } catch (openaiError) {
        console.error('OpenAI parsing error:', openaiError);
      }
    }

    // Final fallback: simple regex parsing
    if (!parsed) {
      parsed = simpleParseInvoice(text, clients || []);
    }

    // Validate and clean the result
    if (parsed && parsed.items) {
      parsed.items = parsed.items.filter(item => 
        item.description && 
        typeof item.quantity === 'number' && 
        typeof item.rate === 'number'
      );

      // Recalculate amounts
      parsed.items = parsed.items.map(item => ({
        ...item,
        amount: item.quantity * item.rate
      }));
    }

    return NextResponse.json({ 
      success: true, 
      invoice: parsed,
      source: GROQ_API_KEY ? 'groq' : OPENAI_API_KEY ? 'openai' : 'regex'
    });

  } catch (error: any) {
    console.error('Invoice parsing error:', error);
    return NextResponse.json({ 
      error: 'Failed to parse invoice',
      details: error.message 
    }, { status: 500 });
  }
}

// Simple regex-based fallback parser
function simpleParseInvoice(text: string, clients: string[]): ParsedInvoice {
  const invoice: ParsedInvoice = { items: [], currency: 'USD' };

  // Extract client name
  const clientPatterns = [
    /(?:invoice|bill|charge)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+(?:Corp|Inc|LLC|Ltd))?)/i,
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match) {
      invoice.clientName = match[1].trim();
      // Try to match to known client
      const knownClient = clients.find(c => 
        c.toLowerCase().includes(invoice.clientName!.toLowerCase())
      );
      if (knownClient) {
        invoice.clientName = knownClient;
      }
      break;
    }
  }

  // Extract amounts
  // Pattern: X hours at $Y
  const hourlyMatch = text.match(/(\d+)\s*(?:hours?|hrs?)\s+(?:at|@)\s+\$(\d+(?:\.\d{2})?)/i);
  if (hourlyMatch) {
    const hours = parseFloat(hourlyMatch[1]);
    const rate = parseFloat(hourlyMatch[2]);
    const description = text.match(/for\s+([^,$]+)/i)?.[1]?.trim() || 'Professional Services';
    invoice.items.push({
      description,
      quantity: hours,
      rate,
      amount: hours * rate
    });
  }

  // Pattern: $X for description
  const simpleMatches = [...text.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:for\s+)?([a-zA-Z][^,$]+)/gi)];
  if (simpleMatches.length > 0 && invoice.items.length === 0) {
    for (const match of simpleMatches) {
      const amount = parseFloat(match[1].replace(',', ''));
      const description = match[2].trim();
      if (description.length > 2) {
        invoice.items.push({
          description,
          quantity: 1,
          rate: amount,
          amount
        });
      }
    }
  }

  // Extract due date
  const dueMatch = text.match(/due\s+(?:in\s+)?(\d+)\s*(?:days?|weeks?)/i);
  if (dueMatch) {
    const value = parseInt(dueMatch[1]);
    const isWeeks = /weeks?/i.test(dueMatch[0]);
    const days = isWeeks ? value * 7 : value;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    invoice.dueDate = dueDate.toISOString().split('T')[0];
  }

  return invoice;
}
