'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  Clock, CheckCircle, AlertCircle, Users, Calendar,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Filter, Download, RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  totalInvoiced: number
  totalPaid: number
  totalOutstanding: number
  totalOverdue: number
  invoiceCount: number
  paidCount: number
  averagePaymentTime: number
  collectionRate: number
  monthlyData: { month: string; invoiced: number; collected: number }[]
  topClients: { name: string; total: number; invoices: number }[]
  statusBreakdown: { status: string; count: number; amount: number }[]
}

const DEMO_DATA: AnalyticsData = {
  totalRevenue: 156750,
  totalInvoiced: 189500,
  totalPaid: 156750,
  totalOutstanding: 24500,
  totalOverdue: 8250,
  invoiceCount: 87,
  paidCount: 72,
  averagePaymentTime: 12.5,
  collectionRate: 82.7,
  monthlyData: [
    { month: 'Jul', invoiced: 12500, collected: 11200 },
    { month: 'Aug', invoiced: 15800, collected: 14500 },
    { month: 'Sep', invoiced: 18200, collected: 16800 },
    { month: 'Oct', invoiced: 22500, collected: 21000 },
    { month: 'Nov', invoiced: 19800, collected: 18500 },
    { month: 'Dec', invoiced: 24750, collected: 22200 },
  ],
  topClients: [
    { name: 'Acme Corporation', total: 45000, invoices: 12 },
    { name: 'TechStart Inc', total: 32500, invoices: 8 },
    { name: 'Global Media', total: 28750, invoices: 15 },
    { name: 'Design Studio Pro', total: 21000, invoices: 6 },
    { name: 'Startup Labs', total: 15500, invoices: 10 },
  ],
  statusBreakdown: [
    { status: 'paid', count: 72, amount: 156750 },
    { status: 'sent', count: 8, amount: 16250 },
    { status: 'overdue', count: 4, amount: 8250 },
    { status: 'draft', count: 3, amount: 8250 },
  ]
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function InvoiceAnalytics() {
  const [data] = useState<AnalyticsData>(DEMO_DATA)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d')

  const maxMonthlyValue = Math.max(...data.monthlyData.map(d => Math.max(d.invoiced, d.collected)))

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Invoice Analytics</h2>
            <p className="text-sm text-gray-400">Track your billing performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-800">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Revenue</span>
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(data.totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">From {data.paidCount} paid invoices</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Outstanding</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(data.totalOutstanding)}</p>
          <p className="text-xs text-gray-500 mt-1">{data.invoiceCount - data.paidCount} unpaid invoices</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overdue</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(data.totalOverdue)}</p>
          <p className="text-xs text-gray-500 mt-1">{data.statusBreakdown.find(s => s.status === 'overdue')?.count || 0} invoices past due</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Collection Rate</span>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{data.collectionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Avg. {data.averagePaymentTime} days to pay</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium mb-4">Revenue Overview</h3>
          
          {/* Simple Bar Chart */}
          <div className="h-48 flex items-end gap-2">
            {data.monthlyData.map((month, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 h-40 items-end">
                  <div 
                    className="flex-1 bg-blue-500/30 rounded-t transition-all hover:bg-blue-500/50"
                    style={{ height: `${(month.invoiced / maxMonthlyValue) * 100}%` }}
                    title={`Invoiced: ${formatCurrency(month.invoiced)}`}
                  />
                  <div 
                    className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-400"
                    style={{ height: `${(month.collected / maxMonthlyValue) * 100}%` }}
                    title={`Collected: ${formatCurrency(month.collected)}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{month.month}</span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500/30 rounded" />
              <span className="text-sm text-gray-400">Invoiced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-400">Collected</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-medium mb-4">Invoice Status</h3>
          
          <div className="space-y-3">
            {data.statusBreakdown.map((status, i) => {
              const percentage = (status.count / data.invoiceCount) * 100
              const colors: Record<string, string> = {
                paid: 'bg-green-500',
                sent: 'bg-blue-500',
                overdue: 'bg-red-500',
                draft: 'bg-gray-500'
              }
              
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm capitalize">{status.status}</span>
                    <span className="text-sm text-gray-400">{status.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[status.status] || 'bg-gray-500'} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(status.amount)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Top Clients</h3>
          <button className="text-sm text-purple-400 hover:text-purple-300">View All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {data.topClients.map((client, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.invoices} invoices</p>
                </div>
              </div>
              <p className="text-lg font-bold">{formatCurrency(client.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-t border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.invoiceCount}</p>
            <p className="text-xs text-gray-500">Total Invoices</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.paidCount}</p>
            <p className="text-xs text-gray-500">Paid Invoices</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.topClients.length}</p>
            <p className="text-xs text-gray-500">Active Clients</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.averagePaymentTime}d</p>
            <p className="text-xs text-gray-500">Avg. Payment Time</p>
          </div>
        </div>
      </div>
    </div>
  )
}
