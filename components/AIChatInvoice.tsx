'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  MessageSquare, Send, Sparkles, Loader2, X, 
  FileText, User, DollarSign, Calendar, CheckCircle,
  Zap, Bot, ArrowRight
} from 'lucide-react'

interface ParsedInvoice {
  clientName?: string
  clientEmail?: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  dueDate?: string
  notes?: string
  currency?: string
  taxRate?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  parsedInvoice?: ParsedInvoice
  timestamp: Date
}

interface AIChatInvoiceProps {
  onCreateInvoice?: (invoice: ParsedInvoice) => void
  onInvoiceGenerated?: (invoice: ParsedInvoice) => void
  clients?: Array<{ name: string; email: string }>
  businessName: string
}

const EXAMPLE_PROMPTS = [
  "Invoice John Smith $500 for website design",
  "Create invoice for 10 hours of consulting at $150/hr",
  "Bill Acme Corp for logo design $800 and branding $1200",
  "Invoice my last client for 3 months of retainer at $2000/month",
  "Quick invoice: Sarah Jones, web development, $3500, due in 2 weeks"
]

export default function AIChatInvoice({ 
  onCreateInvoice, 
  onInvoiceGenerated,
  clients = [], 
  businessName 
}: AIChatInvoiceProps) {
  // Support both prop naming conventions
  const handleCreateInvoice = onCreateInvoice ?? onInvoiceGenerated ?? ((invoice: ParsedInvoice) => console.log('Invoice created:', invoice))
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI invoice assistant. Just tell me what to invoice in plain English.\n\nFor example:\n• "Invoice John $500 for web design"\n• "Bill Acme Corp 10 hours at $100/hr for consulting"\n• "Create invoice for logo design $1200, due next Friday"`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const parseInvoiceFromText = async (text: string): Promise<ParsedInvoice | null> => {
    // Try local parsing first for speed
    const localParsed = localParseInvoice(text)
    if (localParsed && localParsed.items.length > 0) {
      return localParsed
    }

    // Fall back to AI parsing for complex requests
    try {
      const response = await fetch('/api/ai/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          clients: clients.map(c => c.name),
          businessName
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.invoice
      }
    } catch (error) {
      console.error('AI parsing error:', error)
    }

    return localParsed
  }

  const localParseInvoice = (text: string): ParsedInvoice | null => {
    const invoice: ParsedInvoice = { items: [] }
    const lowerText = text.toLowerCase()

    // Extract client name - look for patterns like "Invoice [Name]" or "Bill [Name]"
    const clientPatterns = [
      /(?:invoice|bill|charge)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+(?:Corp|Inc|LLC|Ltd|Company))?)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:for|invoice)/i,
    ]

    for (const pattern of clientPatterns) {
      const match = text.match(pattern)
      if (match) {
        invoice.clientName = match[1].trim()
        // Check if this matches a known client
        const knownClient = clients.find(c => 
          c.name.toLowerCase().includes(invoice.clientName!.toLowerCase())
        )
        if (knownClient) {
          invoice.clientName = knownClient.name
          invoice.clientEmail = knownClient.email
        }
        break
      }
    }

    // Extract amounts with descriptions
    // Pattern: "$X for description" or "description $X" or "X hours at $Y"
    const amountPatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:for\s+)?([^,$]+)/gi,
      /([^,$]+?)\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d+)\s*(?:hours?|hrs?)\s+(?:at|@)\s+\$(\d+(?:\.\d{2})?)\/?(?:hr|hour)?\s*(?:for\s+)?([^,$]*)/gi,
      /(\d+)\s*(?:months?|mos?)\s+(?:at|@|of)?\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)\/?(?:mo|month)?\s*(?:for\s+)?([^,$]*)/gi,
    ]

    // Try hourly pattern first
    const hourlyMatch = text.match(/(\d+)\s*(?:hours?|hrs?)\s+(?:at|@)\s+\$(\d+(?:\.\d{2})?)\/?(?:hr|hour)?\s*(?:for\s+)?([^,$]*)/i)
    if (hourlyMatch) {
      const hours = parseFloat(hourlyMatch[1])
      const rate = parseFloat(hourlyMatch[2])
      const description = hourlyMatch[3]?.trim() || 'Professional Services'
      invoice.items.push({
        description: description,
        quantity: hours,
        rate: rate,
        amount: hours * rate
      })
    }

    // Try monthly pattern
    const monthlyMatch = text.match(/(\d+)\s*(?:months?|mos?)\s+(?:at|@|of)?\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)\/?(?:mo|month)?\s*(?:for\s+)?([^,$]*)/i)
    if (monthlyMatch && invoice.items.length === 0) {
      const months = parseFloat(monthlyMatch[1])
      const rate = parseFloat(monthlyMatch[2].replace(',', ''))
      const description = monthlyMatch[3]?.trim() || 'Monthly Retainer'
      invoice.items.push({
        description: description,
        quantity: months,
        rate: rate,
        amount: months * rate
      })
    }

    // Try simple amount patterns if no items yet
    if (invoice.items.length === 0) {
      // Pattern: $X for description
      const simpleMatches = [...text.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:for\s+)?([a-zA-Z][^,$]*)/gi)]
      for (const match of simpleMatches) {
        const amount = parseFloat(match[1].replace(',', ''))
        const description = match[2].trim()
        if (description && description.length > 2) {
          invoice.items.push({
            description: description,
            quantity: 1,
            rate: amount,
            amount: amount
          })
        }
      }

      // Pattern: description $X
      if (invoice.items.length === 0) {
        const reverseMatches = [...text.matchAll(/([a-zA-Z][^$,]*?)\s+\$(\d+(?:,\d{3})*(?:\.\d{2})?)/gi)]
        for (const match of reverseMatches) {
          const description = match[1].trim()
          const amount = parseFloat(match[2].replace(',', ''))
          // Skip if description looks like a name we already captured
          if (description && description.length > 2 && !description.match(/^(invoice|bill|for|to)\s/i)) {
            invoice.items.push({
              description: description,
              quantity: 1,
              rate: amount,
              amount: amount
            })
          }
        }
      }
    }

    // Extract due date
    const dueDatePatterns = [
      /due\s+(?:in\s+)?(\d+)\s*(?:days?|weeks?)/i,
      /due\s+(?:on\s+)?(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /due\s+(?:by\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    ]

    for (const pattern of dueDatePatterns) {
      const match = text.match(pattern)
      if (match) {
        if (/\d+\s*days?/i.test(match[0])) {
          const days = parseInt(match[1])
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + days)
          invoice.dueDate = dueDate.toISOString().split('T')[0]
        } else if (/\d+\s*weeks?/i.test(match[0])) {
          const weeks = parseInt(match[1])
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + (weeks * 7))
          invoice.dueDate = dueDate.toISOString().split('T')[0]
        }
        break
      }
    }

    // Set default due date if not specified (30 days)
    if (!invoice.dueDate && invoice.items.length > 0) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      invoice.dueDate = dueDate.toISOString().split('T')[0]
    }

    return invoice.items.length > 0 ? invoice : null
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      const parsed = await parseInvoiceFromText(userMessage.content)

      if (parsed && parsed.items.length > 0) {
        const total = parsed.items.reduce((sum, item) => sum + item.amount, 0)
        const itemsList = parsed.items.map(item => 
          `• ${item.description}: ${item.quantity} × $${item.rate.toFixed(2)} = $${item.amount.toFixed(2)}`
        ).join('\n')

        const response: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've prepared your invoice:\n\n**Client:** ${parsed.clientName || 'Not specified'}\n${parsed.clientEmail ? `**Email:** ${parsed.clientEmail}\n` : ''}\n**Items:**\n${itemsList}\n\n**Total:** $${total.toFixed(2)}\n**Due:** ${parsed.dueDate || 'Net 30'}\n\nClick "Create Invoice" to add this to your invoice form, or tell me if you'd like to make any changes.`,
          parsedInvoice: parsed,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, response])
      } else {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I couldn't quite parse that. Try something like:\n\n• "Invoice John $500 for web design"\n• "Bill Acme Corp 10 hours at $100/hr"\n• "Create invoice for logo design $1200"`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, response])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try rephrasing your request.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseInvoice = (parsedInvoice: ParsedInvoice) => {
    handleCreateInvoice(parsedInvoice)
    setIsOpen(false)
    setMessages([messages[0]]) // Reset to initial message
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-40 group"
        title="AI Invoice Assistant"
      >
        <div className="relative">
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          AI Invoice Assistant
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Invoice Assistant</h3>
                  <p className="text-white/80 text-xs">Create invoices with natural language</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    
                    {/* Invoice Preview Card */}
                    {message.parsedInvoice && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <button
                          onClick={() => handleUseInvoice(message.parsedInvoice!)}
                          className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Create Invoice
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Example Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((example, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(example)}
                      className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {example.length > 40 ? example.slice(0, 40) + '...' : example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Invoice John $500 for web design..."
                  className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
