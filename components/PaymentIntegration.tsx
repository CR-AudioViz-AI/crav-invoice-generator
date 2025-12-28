'use client'
import { CreditCard, Link2, Check, Settings } from 'lucide-react'

const INTEGRATIONS = [
  { id: 'stripe', name: 'Stripe', status: 'connected', icon: '💳' },
  { id: 'paypal', name: 'PayPal', status: 'connected', icon: '🅿️' },
  { id: 'square', name: 'Square', status: 'not_connected', icon: '⬛' },
  { id: 'wise', name: 'Wise', status: 'not_connected', icon: '🌐' },
]

export default function PaymentIntegration() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div><h2 className="font-semibold">Payment Integrations</h2><p className="text-sm text-gray-400">Accept payments online</p></div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {INTEGRATIONS.map(int => (
          <div key={int.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{int.icon}</span>
              <div>
                <p className="font-medium">{int.name}</p>
                <p className="text-sm text-gray-400">{int.status === 'connected' ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
            {int.status === 'connected' ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-green-400 text-sm"><Check className="w-4 h-4" />Active</span>
                <button className="p-2 text-gray-400 hover:text-white"><Settings className="w-4 h-4" /></button>
              </div>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm">
                <Link2 className="w-4 h-4" /> Connect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
