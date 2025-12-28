'use client'

import { useState } from 'react'
import { 
  AlertTriangle, Calculator, DollarSign, Percent, 
  Calendar, Info, Settings, CheckCircle
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

interface LateFeeSettings {
  enabled: boolean
  gracePeriodDays: number
  feeType: 'fixed' | 'percentage' | 'daily_percentage'
  feeAmount: number // Fixed amount or percentage
  maxFeePercentage: number // Cap for daily fees
  compoundDaily: boolean
}

interface LateFeeResult {
  daysOverdue: number
  baseFee: number
  totalFee: number
  newTotal: number
  breakdown: string
}

interface LateFeesCalculatorProps {
  invoiceTotal: number
  dueDate: string
  currentDate?: Date
  settings?: LateFeeSettings
  onApplyFee: (fee: number) => void
  onUpdateSettings: (settings: LateFeeSettings) => void
}

const DEFAULT_SETTINGS: LateFeeSettings = {
  enabled: true,
  gracePeriodDays: 0,
  feeType: 'percentage',
  feeAmount: 1.5, // 1.5% per month
  maxFeePercentage: 25, // Max 25% of invoice
  compoundDaily: false
}

export default function LateFeesCalculator({
  invoiceTotal,
  dueDate,
  currentDate = new Date(),
  settings = DEFAULT_SETTINGS,
  onApplyFee,
  onUpdateSettings
}: LateFeesCalculatorProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [localSettings, setLocalSettings] = useState<LateFeeSettings>(settings)

  const calculateLateFee = (): LateFeeResult | null => {
    if (!localSettings.enabled) return null

    const due = new Date(dueDate)
    const daysOverdue = differenceInDays(currentDate, due) - localSettings.gracePeriodDays

    if (daysOverdue <= 0) return null

    let fee = 0
    let breakdown = ''

    switch (localSettings.feeType) {
      case 'fixed':
        fee = localSettings.feeAmount
        breakdown = `Fixed late fee: $${localSettings.feeAmount.toFixed(2)}`
        break

      case 'percentage':
        // Monthly percentage fee
        const months = Math.ceil(daysOverdue / 30)
        fee = invoiceTotal * (localSettings.feeAmount / 100) * months
        breakdown = `${localSettings.feeAmount}% × ${months} month(s) = $${fee.toFixed(2)}`
        break

      case 'daily_percentage':
        // Daily compounding percentage
        if (localSettings.compoundDaily) {
          const dailyRate = localSettings.feeAmount / 100
          fee = invoiceTotal * (Math.pow(1 + dailyRate, daysOverdue) - 1)
          breakdown = `${localSettings.feeAmount}% daily (compounded) × ${daysOverdue} days`
        } else {
          fee = invoiceTotal * (localSettings.feeAmount / 100) * daysOverdue
          breakdown = `${localSettings.feeAmount}% × ${daysOverdue} days = $${fee.toFixed(2)}`
        }
        break
    }

    // Apply maximum cap
    const maxFee = invoiceTotal * (localSettings.maxFeePercentage / 100)
    if (fee > maxFee) {
      fee = maxFee
      breakdown += ` (capped at ${localSettings.maxFeePercentage}%)`
    }

    return {
      daysOverdue,
      baseFee: fee,
      totalFee: fee,
      newTotal: invoiceTotal + fee,
      breakdown
    }
  }

  const result = calculateLateFee()
  const isOverdue = result !== null

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings)
    setShowSettings(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`p-4 flex items-center justify-between ${
        isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        <div className="flex items-center gap-3">
          {isOverdue ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <Calculator className="w-5 h-5 text-gray-500" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Late Fee Calculator
            </h3>
            <p className="text-sm text-gray-500">
              Due: {format(new Date(dueDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Late Fee Settings</h4>
          
          <div className="space-y-4">
            {/* Enable/Disable */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => setLocalSettings({ ...localSettings, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable automatic late fees</span>
            </label>

            {localSettings.enabled && (
              <>
                {/* Grace Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grace Period (days)
                  </label>
                  <input
                    type="number"
                    value={localSettings.gracePeriodDays}
                    onChange={(e) => setLocalSettings({ ...localSettings, gracePeriodDays: Number(e.target.value) })}
                    className="w-24 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                    min="0"
                    max="30"
                  />
                </div>

                {/* Fee Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Type
                  </label>
                  <select
                    value={localSettings.feeType}
                    onChange={(e) => setLocalSettings({ ...localSettings, feeType: e.target.value as any })}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage (Monthly)</option>
                    <option value="daily_percentage">Percentage (Daily)</option>
                  </select>
                </div>

                {/* Fee Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {localSettings.feeType === 'fixed' ? 'Fee Amount ($)' : 'Fee Percentage (%)'}
                  </label>
                  <div className="flex items-center gap-2">
                    {localSettings.feeType === 'fixed' ? (
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Percent className="w-4 h-4 text-gray-400" />
                    )}
                    <input
                      type="number"
                      value={localSettings.feeAmount}
                      onChange={(e) => setLocalSettings({ ...localSettings, feeAmount: Number(e.target.value) })}
                      className="w-24 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                      min="0"
                      step={localSettings.feeType === 'fixed' ? '1' : '0.1'}
                    />
                    {localSettings.feeType === 'daily_percentage' && (
                      <span className="text-sm text-gray-500">per day</span>
                    )}
                    {localSettings.feeType === 'percentage' && (
                      <span className="text-sm text-gray-500">per month</span>
                    )}
                  </div>
                </div>

                {/* Max Fee Cap */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Fee Cap (% of invoice)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localSettings.maxFeePercentage}
                      onChange={(e) => setLocalSettings({ ...localSettings, maxFeePercentage: Number(e.target.value) })}
                      className="w-24 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>

                {/* Compound Daily */}
                {localSettings.feeType === 'daily_percentage' && (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={localSettings.compoundDaily}
                      onChange={(e) => setLocalSettings({ ...localSettings, compoundDaily: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Compound daily</span>
                  </label>
                )}
              </>
            )}

            <button
              onClick={handleSaveSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        {!localSettings.enabled ? (
          <div className="text-center py-4">
            <Info className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Late fees are disabled</p>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Enable late fees
            </button>
          </div>
        ) : !isOverdue ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Invoice is not overdue
            </p>
            <p className="text-xs text-gray-500 mt-1">
              No late fees applicable
            </p>
          </div>
        ) : result && (
          <div className="space-y-4">
            {/* Overdue Alert */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{result.daysOverdue} days overdue</span>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Original Amount</span>
                <span className="font-medium">${invoiceTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Late Fee</span>
                <span className="font-medium text-red-600">+${result.totalFee.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-400 pl-4">
                {result.breakdown}
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>New Total</span>
                <span className="text-red-600">${result.newTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => onApplyFee(result.totalFee)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Apply Late Fee (${result.totalFee.toFixed(2)})
            </button>
          </div>
        )}
      </div>

      {/* Legal Note */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          Late fees are subject to local laws. Consult legal advice for compliance.
        </p>
      </div>
    </div>
  )
}
