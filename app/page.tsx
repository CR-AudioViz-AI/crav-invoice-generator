'use client'

import { useState, useRef } from 'react'
import {
  FileText, Plus, Send, Download, DollarSign, Users,
  Clock, CheckCircle, AlertCircle, Settings, Search,
  Filter, MoreVertical, Edit3, Trash2, Copy, Eye,
  Calendar, TrendingUp, RefreshCw, MessageSquare,
  CreditCard, Mail, Printer, BarChart3, Sparkles,
  Menu, X, ChevronDown, ExternalLink
} from 'lucide-react'

// Import components
import AIChatInvoice from '@/components/AIChatInvoice'
import TemplateSelector from '@/components/TemplateSelector'
import TimeTracking from '@/components/TimeTracking'
import Estimates from '@/components/Estimates'
import LateFeesCalculator from '@/components/LateFeesCalculator'
import PaymentQRCode from '@/components/PaymentQRCode'
import RecurringInvoiceManager from '@/components/RecurringInvoiceManager'
import InvoiceAnalytics from '@/components/InvoiceAnalytics'
import ClientPortal from '@/components/ClientPortal'
import CrossMarketingFooter from '@/components/CrossMarketingFooter'
import JavariWidget from '@/components/JavariWidget'

type ActiveView = 'dashboard' | 'invoices' | 'create' | 'recurring' | 'analytics' | 'clients' | 'estimates' | 'time' | 'settings' | 'client-portal'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  issue_date: string
  items: { description: string; quantity: number; rate: number; amount: number }[]
}

const DEMO_INVOICES: Invoice[] = [
  {
    id: '1', invoice_number: 'INV-2024-001', client_name: 'Acme Corporation',
    client_email: 'billing@acme.com', amount: 2500, currency: 'USD',
    status: 'paid', due_date: '2024-12-15', issue_date: '2024-12-01',
    items: [{ description: 'Web Development', quantity: 1, rate: 2500, amount: 2500 }]
  },
  {
    id: '2', invoice_number: 'INV-2024-002', client_name: 'TechStart Inc',
    client_email: 'accounts@techstart.io', amount: 4500, currency: 'USD',
    status: 'sent', due_date: '2025-01-05', issue_date: '2024-12-20',
    items: [{ description: 'Consulting', quantity: 10, rate: 450, amount: 4500 }]
  },
  {
    id: '3', invoice_number: 'INV-2024-003', client_name: 'Design Studio',
    client_email: 'pay@designstudio.com', amount: 1200, currency: 'USD',
    status: 'overdue', due_date: '2024-12-10', issue_date: '2024-11-25',
    items: [{ description: 'Logo Design', quantity: 1, rate: 1200, amount: 1200 }]
  },
  {
    id: '4', invoice_number: 'INV-2024-004', client_name: 'Global Media',
    client_email: 'invoices@globalmedia.com', amount: 3750, currency: 'USD',
    status: 'viewed', due_date: '2025-01-10', issue_date: '2024-12-22',
    items: [{ description: 'Video Production', quantity: 1, rate: 3750, amount: 3750 }]
  },
]

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InvoiceGeneratorPage() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAIChat, setShowAIChat] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Stats
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalOutstanding = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const paidCount = invoices.filter(i => i.status === 'paid').length

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      viewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return colors[status] || colors.draft
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'recurring', label: 'Recurring', icon: RefreshCw, badge: 'NEW' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: 'NEW' },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'estimates', label: 'Estimates', icon: FileText },
    { id: 'time', label: 'Time Tracking', icon: Clock },
    { id: 'client-portal', label: 'Client Portal', icon: ExternalLink, badge: 'NEW' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Invoice Generator Pro
            </h1>
            <span className="hidden sm:inline px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              Pro
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
            <button
              onClick={() => setActiveView('create')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-56 bg-gray-900 border-r border-gray-800 fixed md:sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto z-30`}>
          <nav className="p-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as ActiveView)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeView === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-57px)]">
          <div className="max-w-6xl mx-auto">
            
            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">{paidCount} paid invoices</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Outstanding</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalOutstanding)}</p>
                    <p className="text-xs text-gray-500 mt-1">{invoices.length - paidCount} pending</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Overdue</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Needs attention</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Total Invoices</span>
                    </div>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                    <p className="text-xs text-gray-500 mt-1">This period</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveView('create')}
                    className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">New Invoice</p>
                      <p className="text-xs text-gray-500">Create manually</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">AI Create</p>
                      <p className="text-xs text-gray-500">Natural language</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveView('recurring')}
                    className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Recurring</p>
                      <p className="text-xs text-gray-500">Auto billing</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveView('analytics')}
                    className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Analytics</p>
                      <p className="text-xs text-gray-500">View reports</p>
                    </div>
                  </button>
                </div>

                {/* Recent Invoices */}
                <div className="bg-gray-800 rounded-xl">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold">Recent Invoices</h2>
                    <button
                      onClick={() => setActiveView('invoices')}
                      className="text-sm text-green-400 hover:text-green-300"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {invoices.slice(0, 5).map(invoice => (
                      <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-gray-750">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-400">{invoice.client_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                          <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Invoices List View */}
            {activeView === 'invoices' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="viewed">Viewed</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Invoice List */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-4 text-sm text-gray-400 font-medium">Invoice</th>
                          <th className="text-left p-4 text-sm text-gray-400 font-medium">Client</th>
                          <th className="text-left p-4 text-sm text-gray-400 font-medium">Amount</th>
                          <th className="text-left p-4 text-sm text-gray-400 font-medium">Status</th>
                          <th className="text-left p-4 text-sm text-gray-400 font-medium">Due Date</th>
                          <th className="text-right p-4 text-sm text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map(invoice => (
                          <tr key={invoice.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-750">
                            <td className="p-4">
                              <span className="font-medium">{invoice.invoice_number}</span>
                            </td>
                            <td className="p-4">
                              <div>
                                <p>{invoice.client_name}</p>
                                <p className="text-sm text-gray-500">{invoice.client_email}</p>
                              </div>
                            </td>
                            <td className="p-4 font-medium">{formatCurrency(invoice.amount)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400">{formatDate(invoice.due_date)}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-1">
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                                  <Send className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                                  <Download className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Create Invoice View */}
            {activeView === 'create' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Create Invoice</h2>
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    Use AI Instead
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <AIChatInvoice onInvoiceCreated={(inv) => {
                      setInvoices([inv, ...invoices])
                      setActiveView('invoices')
                    }} />
                  </div>
                  <div>
                    <TemplateSelector onSelect={(template) => console.log('Selected:', template)} />
                  </div>
                </div>
              </div>
            )}

            {/* Recurring Invoices View */}
            {activeView === 'recurring' && (
              <RecurringInvoiceManager />
            )}

            {/* Analytics View */}
            {activeView === 'analytics' && (
              <InvoiceAnalytics />
            )}

            {/* Clients View */}
            {activeView === 'clients' && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Client Management</h2>
                <p className="text-gray-400">Manage your clients and their billing information.</p>
                {/* Client list would go here */}
              </div>
            )}

            {/* Estimates View */}
            {activeView === 'estimates' && (
              <Estimates />
            )}

            {/* Time Tracking View */}
            {activeView === 'time' && (
              <TimeTracking />
            )}

            {/* Client Portal Preview */}
            {activeView === 'client-portal' && (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium text-purple-300">Client Portal Preview</p>
                      <p className="text-sm text-gray-400">This is how your clients see their invoices</p>
                    </div>
                  </div>
                </div>
                <ClientPortal businessName="CR AudioViz AI" />
              </div>
            )}

            {/* Settings View */}
            {activeView === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Business Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Business Name</label>
                        <input
                          type="text"
                          defaultValue="CR AudioViz AI"
                          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue="billing@craudiovizai.com"
                          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Payment Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-purple-400" />
                          <span>Stripe</span>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-blue-400" />
                          <span>PayPal</span>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold">AI Invoice Assistant</h2>
              </div>
              <button onClick={() => setShowAIChat(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <AIChatInvoice onInvoiceCreated={(inv) => {
                setInvoices([inv, ...invoices])
                setShowAIChat(false)
                setActiveView('invoices')
              }} />
            </div>
          </div>
        </div>
      )}

      <CrossMarketingFooter currentApp="invoice-generator" />
      <JavariWidget />
    </div>
  )
}
