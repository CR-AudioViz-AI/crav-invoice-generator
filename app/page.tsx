'use client'

import { useState } from 'react'
import {
  FileText, Plus, Send, Download, DollarSign, Users,
  Clock, AlertCircle, Settings, Search, Eye, TrendingUp,
  RefreshCw, CreditCard, BarChart3, Sparkles, Menu, X, ExternalLink
} from 'lucide-react'

import RecurringInvoiceManager from '@/components/RecurringInvoiceManager'
import InvoiceAnalytics from '@/components/InvoiceAnalytics'
import ClientPortal from '@/components/ClientPortal'
import CrossMarketingFooter from '@/components/CrossMarketingFooter'
import JavariWidget from '@/components/JavariWidget'

type ActiveView = 'dashboard' | 'invoices' | 'create' | 'recurring' | 'analytics' | 'clients' | 'client-portal' | 'settings'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue'
  due_date: string
  issue_date: string
  items: { description: string; quantity: number; rate: number; amount: number }[]
}

const DEMO_INVOICES: Invoice[] = [
  { id: '1', invoice_number: 'INV-2024-001', client_name: 'Acme Corporation', client_email: 'billing@acme.com', amount: 2500, currency: 'USD', status: 'paid', due_date: '2024-12-15', issue_date: '2024-12-01', items: [{ description: 'Web Development', quantity: 1, rate: 2500, amount: 2500 }] },
  { id: '2', invoice_number: 'INV-2024-002', client_name: 'TechStart Inc', client_email: 'accounts@techstart.io', amount: 4500, currency: 'USD', status: 'sent', due_date: '2025-01-05', issue_date: '2024-12-20', items: [{ description: 'Consulting', quantity: 10, rate: 450, amount: 4500 }] },
  { id: '3', invoice_number: 'INV-2024-003', client_name: 'Design Studio', client_email: 'pay@design.com', amount: 1200, currency: 'USD', status: 'overdue', due_date: '2024-12-10', issue_date: '2024-11-25', items: [{ description: 'Logo Design', quantity: 1, rate: 1200, amount: 1200 }] },
  { id: '4', invoice_number: 'INV-2024-004', client_name: 'Global Media', client_email: 'invoices@global.com', amount: 3750, currency: 'USD', status: 'viewed', due_date: '2025-01-10', issue_date: '2024-12-22', items: [{ description: 'Video Production', quantity: 1, rate: 3750, amount: 3750 }] },
]

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function InvoiceGeneratorPage() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [invoices] = useState<Invoice[]>(DEMO_INVOICES)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalOutstanding = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || inv.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { paid: 'bg-green-500/20 text-green-400 border-green-500/30', sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30', viewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30', overdue: 'bg-red-500/20 text-red-400 border-red-500/30', draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    return colors[status] || colors.draft
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'recurring', label: 'Recurring', icon: RefreshCw, badge: 'NEW' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: 'NEW' },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'client-portal', label: 'Client Portal', icon: ExternalLink, badge: 'NEW' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Invoice Generator Pro</h1>
            <span className="hidden sm:inline px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Pro</span>
          </div>
          <button onClick={() => setActiveView('create')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"><Plus className="w-4 h-4" /><span className="hidden sm:inline">New Invoice</span></button>
        </div>
      </header>

      <div className="flex">
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-56 bg-gray-900 border-r border-gray-800 fixed md:sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto z-30`}>
          <nav className="p-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveView(item.id as ActiveView); setMobileMenuOpen(false) }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 ${activeView === item.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <div className="flex items-center gap-3"><item.icon className="w-4 h-4" /><span className="text-sm">{item.label}</span></div>
                {item.badge && <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-57px)]">
          <div className="max-w-6xl mx-auto">
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-xl p-4"><div className="flex items-center gap-2 text-gray-400 mb-2"><DollarSign className="w-4 h-4" /><span className="text-sm">Revenue</span></div><p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p></div>
                  <div className="bg-gray-800 rounded-xl p-4"><div className="flex items-center gap-2 text-gray-400 mb-2"><Clock className="w-4 h-4" /><span className="text-sm">Outstanding</span></div><p className="text-2xl font-bold text-orange-400">{formatCurrency(totalOutstanding)}</p></div>
                  <div className="bg-gray-800 rounded-xl p-4"><div className="flex items-center gap-2 text-gray-400 mb-2"><AlertCircle className="w-4 h-4" /><span className="text-sm">Overdue</span></div><p className="text-2xl font-bold text-red-400">{overdueCount}</p></div>
                  <div className="bg-gray-800 rounded-xl p-4"><div className="flex items-center gap-2 text-gray-400 mb-2"><FileText className="w-4 h-4" /><span className="text-sm">Total</span></div><p className="text-2xl font-bold">{invoices.length}</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => setActiveView('create')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl"><div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"><Plus className="w-5 h-5 text-green-400" /></div><div className="text-left"><p className="font-medium">New Invoice</p></div></button>
                  <button onClick={() => setActiveView('recurring')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl"><div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><RefreshCw className="w-5 h-5 text-blue-400" /></div><div className="text-left"><p className="font-medium">Recurring</p></div></button>
                  <button onClick={() => setActiveView('analytics')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl"><div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-cyan-400" /></div><div className="text-left"><p className="font-medium">Analytics</p></div></button>
                  <button onClick={() => setActiveView('client-portal')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl"><div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><ExternalLink className="w-5 h-5 text-purple-400" /></div><div className="text-left"><p className="font-medium">Client Portal</p></div></button>
                </div>
                <div className="bg-gray-800 rounded-xl">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between"><h2 className="font-semibold">Recent Invoices</h2><button onClick={() => setActiveView('invoices')} className="text-sm text-green-400">View All</button></div>
                  <div className="divide-y divide-gray-700">
                    {invoices.slice(0, 5).map(inv => (
                      <div key={inv.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-gray-400" /></div><div><p className="font-medium">{inv.invoice_number}</p><p className="text-sm text-gray-400">{inv.client_name}</p></div></div>
                        <div className="flex items-center gap-4"><span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(inv.status)}`}>{inv.status}</span><span className="font-medium">{formatCurrency(inv.amount)}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'invoices' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" /></div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"><option value="all">All</option><option value="paid">Paid</option><option value="sent">Sent</option><option value="overdue">Overdue</option></select>
                </div>
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-700"><th className="text-left p-4 text-sm text-gray-400">Invoice</th><th className="text-left p-4 text-sm text-gray-400">Client</th><th className="text-left p-4 text-sm text-gray-400">Amount</th><th className="text-left p-4 text-sm text-gray-400">Status</th><th className="text-left p-4 text-sm text-gray-400">Due</th><th className="text-right p-4"></th></tr></thead>
                    <tbody>{filteredInvoices.map(inv => (<tr key={inv.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-750"><td className="p-4 font-medium">{inv.invoice_number}</td><td className="p-4">{inv.client_name}</td><td className="p-4 font-medium">{formatCurrency(inv.amount)}</td><td className="p-4"><span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(inv.status)}`}>{inv.status}</span></td><td className="p-4 text-gray-400">{formatDate(inv.due_date)}</td><td className="p-4"><div className="flex justify-end gap-1"><button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><Eye className="w-4 h-4" /></button><button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><Send className="w-4 h-4" /></button><button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><Download className="w-4 h-4" /></button></div></td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView === 'create' && (<div className="bg-gray-800 rounded-xl p-8 text-center"><Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Create New Invoice</h2><p className="text-gray-400 mb-6">Use our AI assistant or manual form</p><div className="flex gap-4 justify-center"><button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"><Sparkles className="w-5 h-5" />AI Assistant</button><button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"><FileText className="w-5 h-5" />Manual Form</button></div></div>)}
            {activeView === 'recurring' && <RecurringInvoiceManager />}
            {activeView === 'analytics' && <InvoiceAnalytics />}
            {activeView === 'clients' && <div className="bg-gray-800 rounded-xl p-6"><h2 className="text-xl font-bold mb-4">Client Management</h2><p className="text-gray-400">Manage clients and billing.</p></div>}
            {activeView === 'client-portal' && (<div className="space-y-4"><div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"><div className="flex items-center gap-3"><ExternalLink className="w-5 h-5 text-purple-400" /><div><p className="font-medium text-purple-300">Client Portal Preview</p><p className="text-sm text-gray-400">How clients see their invoices</p></div></div></div><ClientPortal businessName="CR AudioViz AI" /></div>)}
            {activeView === 'settings' && (<div className="space-y-6"><h2 className="text-2xl font-bold">Settings</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gray-800 rounded-xl p-6"><h3 className="font-semibold mb-4">Business Info</h3><div className="space-y-4"><div><label className="block text-sm text-gray-400 mb-1">Business Name</label><input type="text" defaultValue="CR AudioViz AI" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white" /></div></div></div><div className="bg-gray-800 rounded-xl p-6"><h3 className="font-semibold mb-4">Payment</h3><div className="space-y-4"><div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"><div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-purple-400" /><span>Stripe</span></div><span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Connected</span></div></div></div></div></div>)}
          </div>
        </main>
      </div>

      <CrossMarketingFooter />
      <JavariWidget />
    </div>
  )
}
