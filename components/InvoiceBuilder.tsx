'use client'

import { useState } from 'react'
import {
  FileText, Plus, Trash2, Calculator, Download, Send,
  Building2, User, Calendar, DollarSign, Percent, Save
} from 'lucide-react'

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function InvoiceBuilder() {
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: 'Web Design Services', quantity: 1, rate: 1500, amount: 1500 },
    { id: '2', description: 'Logo Design', quantity: 1, rate: 500, amount: 500 },
  ])
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal + taxAmount - discountAmount

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate
        }
        return updated
      }
      return item
    }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Invoice Builder</h2>
            <p className="text-sm text-gray-400">Create professional invoices</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Client & Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bill To</label>
            <input type="text" placeholder="Client name" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Invoice Number</label>
            <input type="text" value="INV-005" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Invoice Date</label>
            <input type="date" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Due Date</label>
            <input type="date" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Line Items</h3>
            <button onClick={addItem} className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-sm text-gray-400 px-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-1"></div>
            </div>
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="col-span-5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Item description"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <div className="col-span-2 px-3 py-2 text-right font-medium">
                  ${item.amount.toFixed(2)}
                </div>
                <button onClick={() => removeItem(item.id)} className="col-span-1 p-2 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tax (%)</span>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-gray-700 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Discount (%)</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-gray-700 rounded text-right"
              />
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700 text-lg font-bold">
              <span>Total</span>
              <span className="text-emerald-400">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
            <Send className="w-4 h-4" /> Send Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
