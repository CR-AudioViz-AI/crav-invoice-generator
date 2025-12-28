'use client'

import { useState, useEffect } from 'react'
import {
  Palette, Type, Image, Check, Copy, Download, Upload,
  RefreshCw, Link2, ExternalLink, Sparkles, Lock, Unlock,
  ChevronDown, Eye, Edit3, Trash2, Plus, Save, Cloud
} from 'lucide-react'

interface BrandAsset {
  id: string
  type: 'logo' | 'icon' | 'favicon' | 'watermark'
  name: string
  url: string
  format: string
}

interface BrandKit {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  fonts: {
    heading: string
    body: string
  }
  assets: BrandAsset[]
  syncedApps: string[]
  lastUpdated: string
}

interface UniversalBrandKitProps {
  currentApp?: string
  onApplyBrand?: (kit: BrandKit) => void
  compact?: boolean
}

const DEFAULT_BRAND_KIT: BrandKit = {
  id: 'default',
  name: 'My Brand',
  colors: {
    primary: '#7c3aed',
    secondary: '#a855f7',
    accent: '#f472b6',
    background: '#0f0f23',
    text: '#ffffff'
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter'
  },
  assets: [
    { id: '1', type: 'logo', name: 'Primary Logo', url: '', format: 'SVG' },
    { id: '2', type: 'icon', name: 'App Icon', url: '', format: 'PNG' },
    { id: '3', type: 'favicon', name: 'Favicon', url: '', format: 'ICO' },
  ],
  syncedApps: ['logo-studio', 'social-graphics', 'invoice-generator', 'website-builder'],
  lastUpdated: new Date().toISOString()
}

const SYNCED_APPS = [
  { id: 'logo-studio', name: 'Logo Studio', synced: true },
  { id: 'social-graphics', name: 'Social Graphics', synced: true },
  { id: 'invoice-generator', name: 'Invoice Generator', synced: true },
  { id: 'website-builder', name: 'Website Builder', synced: true },
  { id: 'qr-generator', name: 'QR Generator', synced: false },
]

export default function UniversalBrandKit({ 
  currentApp = '',
  onApplyBrand,
  compact = false 
}: UniversalBrandKitProps) {
  const [brandKit, setBrandKit] = useState<BrandKit>(DEFAULT_BRAND_KIT)
  const [isEditing, setIsEditing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [showSyncPanel, setShowSyncPanel] = useState(false)

  const copyColor = (color: string, name: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(name)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const syncToAllApps = async () => {
    setIsSyncing(true)
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1500))
    setBrandKit(prev => ({ ...prev, lastUpdated: new Date().toISOString() }))
    setIsSyncing(false)
  }

  const applyToCurrentApp = () => {
    if (onApplyBrand) {
      onApplyBrand(brandKit)
    }
  }

  // Compact view for sidebar/widget
  if (compact) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">{brandKit.name}</p>
              <p className="text-xs text-gray-500">Universal Brand Kit</p>
            </div>
          </div>
          <button
            onClick={syncToAllApps}
            disabled={isSyncing}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Colors */}
        <div className="flex gap-1 mb-3">
          {Object.entries(brandKit.colors).slice(0, 4).map(([name, color]) => (
            <button
              key={name}
              onClick={() => copyColor(color, name)}
              className="w-8 h-8 rounded-lg border border-gray-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={`${name}: ${color}`}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={applyToCurrentApp}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
          <button className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs">
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        </div>

        {/* Sync Status */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Cloud className="w-3 h-3" />
            Synced to {brandKit.syncedApps.length} apps
            <Link2 className="w-3 h-3 ml-auto" />
          </div>
        </div>
      </div>
    )
  }

  // Full view
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Universal Brand Kit</h2>
              <p className="text-sm text-gray-400">Your brand, synced across all apps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncToAllApps}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  Sync All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Brand Name */}
      <div className="p-4 border-b border-gray-800 bg-gray-800/30">
        <label className="block text-sm text-gray-400 mb-1">Brand Name</label>
        <input
          type="text"
          value={brandKit.name}
          onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Colors */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-medium mb-3">Brand Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(brandKit.colors).map(([name, color]) => (
            <div key={name} className="space-y-2">
              <div
                className="aspect-square rounded-xl cursor-pointer hover:scale-105 transition-transform border border-gray-600"
                style={{ backgroundColor: color }}
                onClick={() => copyColor(color, name)}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 capitalize">{name}</span>
                <button
                  onClick={() => copyColor(color, name)}
                  className="p-1 text-gray-500 hover:text-white"
                >
                  {copiedColor === name ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <input
                type="text"
                value={color}
                onChange={(e) => setBrandKit({
                  ...brandKit,
                  colors: { ...brandKit.colors, [name]: e.target.value }
                })}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-medium mb-3">Typography</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Heading Font</label>
            <select
              value={brandKit.fonts.heading}
              onChange={(e) => setBrandKit({
                ...brandKit,
                fonts: { ...brandKit.fonts, heading: e.target.value }
              })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option>Inter</option>
              <option>Poppins</option>
              <option>Montserrat</option>
              <option>Playfair Display</option>
              <option>Roboto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Body Font</label>
            <select
              value={brandKit.fonts.body}
              onChange={(e) => setBrandKit({
                ...brandKit,
                fonts: { ...brandKit.fonts, body: e.target.value }
              })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option>Inter</option>
              <option>Open Sans</option>
              <option>Roboto</option>
              <option>Lato</option>
              <option>Source Sans Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Brand Assets</h3>
          <button className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {brandKit.assets.map(asset => (
            <div key={asset.id} className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                {asset.url ? (
                  <img src={asset.url} alt={asset.name} className="max-w-full max-h-full" />
                ) : (
                  <Image className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <p className="text-sm font-medium truncate">{asset.name}</p>
              <p className="text-xs text-gray-500">{asset.format}</p>
            </div>
          ))}
          <button className="aspect-square bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 hover:border-violet-500 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Synced Apps</h3>
          <span className="text-sm text-gray-500">
            Last synced: {new Date(brandKit.lastUpdated).toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {SYNCED_APPS.map(app => (
            <div
              key={app.id}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                app.synced ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800'
              }`}
            >
              {app.synced ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-gray-600" />
              )}
              <span className="text-sm">{app.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
