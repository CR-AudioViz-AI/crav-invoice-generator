'use client'
import { Calendar, Plus, Play, Pause, Clock } from 'lucide-react'

const RECURRING = [
  { id: '1', client: 'Acme Corp', amount: 2500, frequency: 'Monthly', nextDate: '2025-01-01', status: 'active' },
  { id: '2', client: 'TechStart LLC', amount: 1500, frequency: 'Weekly', nextDate: '2025-01-03', status: 'active' },
  { id: '3', client: 'Design Studio', amount: 3000, frequency: 'Quarterly', nextDate: '2025-03-01', status: 'paused' },
]

export default function RecurringInvoices() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div><h2 className="font-semibold">Recurring Invoices</h2><p className="text-sm text-gray-400">Automated billing</p></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
          <Plus className="w-4 h-4" /> Create Recurring
        </button>
      </div>
      <div className="divide-y divide-gray-800">
        {RECURRING.map(item => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{item.client}</p>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>${item.amount.toLocaleString()} / {item.frequency}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Next: {item.nextDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {item.status}
              </span>
              <button className="p-2 text-gray-400 hover:text-white">
                {item.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
