'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Save, Plus, Trash2, Send, Eye } from 'lucide-react'
import { Invoice, InvoiceItem } from '@/types/invoice'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function InvoiceGenerator() {
  const [invoice, setInvoice] = useState<Invoice>({
    invoice_number: generateInvoiceNumber(),
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'draft',
    
    from_name: '',
    from_email: '',
    from_address: '',
    from_city: '',
    from_state: '',
    from_zip: '',
    from_country: 'USA',
    
    to_name: '',
    to_email: '',
    to_address: '',
    to_city: '',
    to_state: '',
    to_zip: '',
    to_country: 'USA',
    
    items: [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }],
    
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total: 0,
    
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
    template: 'modern'
  })

  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Calculate totals whenever items or tax rate changes
  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = subtotal * (invoice.tax_rate / 100)
    const total = subtotal + taxAmount - invoice.discount_amount
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total
    }))
  }, [invoice.items, invoice.tax_rate, invoice.discount_amount])

  // Load saved invoices
  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      if (data) {
        setSavedInvoices(data.map(inv => ({
          ...inv,
          items: JSON.parse(inv.items as any)
        })))
      }
    } catch (error: any) {
      console.error('Error loading invoices:', error)
    }
  }

  function generateInvoiceNumber() {
    return `INV-${Date.now().toString().slice(-8)}`
  }

  function addItem() {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  function removeItem(id: string) {
    if (invoice.items.length === 1) return // Keep at least one item
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: any) {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item
        
        const updated = { ...item, [field]: value }
        // Recalculate amount
        updated.amount = updated.quantity * updated.rate
        return updated
      })
    }))
  }

  function updateInvoiceField(field: keyof Invoice, value: any) {
    setInvoice(prev => ({ ...prev, [field]: value }))
  }

  async function saveInvoice() {
    setSaving(true)
    try {
      // Deduct credits (10 credits per invoice save)
      const creditCost = parseInt(process.env.NEXT_PUBLIC_CREDIT_COST || '10')
      
      // In production, you'd check user credits here
      // For now, just save to database
      
      const invoiceData = {
        ...invoice,
        items: JSON.stringify(invoice.items),
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('invoices')
        .insert([invoiceData])
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Invoice saved successfully!' })
      loadInvoices()
      
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save invoice' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  function downloadPDF() {
    try {
      const pdf = generateInvoicePDF(invoice)
      pdf.save(`invoice-${invoice.invoice_number}.pdf`)
      setMessage({ type: 'success', text: 'PDF downloaded successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to generate PDF' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  function previewPDF() {
    try {
      const pdf = generateInvoicePDF(invoice)
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to preview PDF' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  function loadInvoice(savedInvoice: Invoice) {
    setInvoice({
      ...savedInvoice,
      invoice_number: generateInvoiceNumber() // Generate new number for copy
    })
    setShowHistory(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
              <p className="text-gray-600">Create professional invoices in seconds</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
        
        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoice.invoice_number}
                  onChange={(e) => updateInvoiceField('invoice_number', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoice.invoice_date}
                  onChange={(e) => updateInvoiceField('invoice_date', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoice.due_date}
                  onChange={(e) => updateInvoiceField('due_date', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={invoice.status}
                  onChange={(e) => updateInvoiceField('status', e.target.value)}
                  className="input-field"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={invoice.template}
                  onChange={(e) => updateInvoiceField('template', e.target.value as any)}
                  className="input-field"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimalist">Minimalist</option>
                </select>
              </div>
            </div>
          </div>

          {/* From Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">From (Your Business)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={invoice.from_name}
                  onChange={(e) => updateInvoiceField('from_name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={invoice.from_email}
                  onChange={(e) => updateInvoiceField('from_email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={invoice.from_address}
                  onChange={(e) => updateInvoiceField('from_address', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={invoice.from_city}
                  onChange={(e) => updateInvoiceField('from_city', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={invoice.from_state}
                  onChange={(e) => updateInvoiceField('from_state', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={invoice.from_zip}
                  onChange={(e) => updateInvoiceField('from_zip', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={invoice.from_country}
                  onChange={(e) => updateInvoiceField('from_country', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* To Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bill To (Client)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={invoice.to_name}
                  onChange={(e) => updateInvoiceField('to_name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={invoice.to_email}
                  onChange={(e) => updateInvoiceField('to_email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={invoice.to_address}
                  onChange={(e) => updateInvoiceField('to_address', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={invoice.to_city}
                  onChange={(e) => updateInvoiceField('to_city', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={invoice.to_state}
                  onChange={(e) => updateInvoiceField('to_state', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={invoice.to_zip}
                  onChange={(e) => updateInvoiceField('to_zip', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={invoice.to_country}
                  onChange={(e) => updateInvoiceField('to_country', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Line Items</h2>
              <button
                onClick={addItem}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {invoice.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="input-field"
                      placeholder="Item description"
                    />
                  </div>
                  
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                      className="input-field"
                    />
                  </div>
                  
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                      className="input-field"
                    />
                  </div>
                  
                  <div className="col-span-3 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <div className="input-field bg-gray-100 text-gray-700">
                      ${item.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex items-end">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={invoice.items.length === 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={invoice.notes}
                  onChange={(e) => updateInvoiceField('notes', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Additional notes or comments..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={invoice.terms}
                  onChange={(e) => updateInvoiceField('terms', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Payment terms and conditions..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={invoice.tax_rate}
                  onChange={(e) => updateInvoiceField('tax_rate', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax Amount:</span>
                <span className="font-semibold">${invoice.tax_amount.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.discount_amount}
                  onChange={(e) => updateInvoiceField('discount_amount', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">TOTAL:</span>
                  <span className="font-bold text-primary text-2xl">
                    ${invoice.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <button
                onClick={previewPDF}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Preview PDF
              </button>
              
              <button
                onClick={downloadPDF}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              
              <button
                onClick={saveInvoice}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-semibold">💡 Tip:</p>
              <p>Saving costs 10 credits. Downloads are free!</p>
            </div>
          </div>
          
          {/* Invoice History */}
          {showHistory && savedInvoices.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Invoices</h2>
              <div className="space-y-2">
                {savedInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => loadInvoice(inv)}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-gray-900">{inv.invoice_number}</div>
                    <div className="text-sm text-gray-600">{inv.to_name}</div>
                    <div className="text-sm text-gray-500">${inv.total.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
