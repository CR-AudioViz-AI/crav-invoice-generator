/**
 * INVOICE TEMPLATE SELECTOR COMPONENT
 * Browse and select from professional invoice templates
 * 
 * @version 1.0.0
 * @date December 27, 2025
 */

'use client';

import { useState } from 'react';
import { 
  FileText, Check, X, Search, Filter,
  Briefcase, Paintbrush, Minimize2, Building2, Factory
} from 'lucide-react';
import { INVOICE_TEMPLATES, getTemplateCategories, InvoiceTemplate } from '@/lib/invoice-templates';

interface TemplateSelectorProps {
  currentTemplate: string;
  onSelectTemplate: (template: InvoiceTemplate) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  professional: <Briefcase className="w-4 h-4" />,
  minimal: <Minimize2 className="w-4 h-4" />,
  creative: <Paintbrush className="w-4 h-4" />,
  corporate: <Building2 className="w-4 h-4" />,
  industry: <Factory className="w-4 h-4" />
};

export default function TemplateSelector({
  currentTemplate,
  onSelectTemplate,
  onClose
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const categories = getTemplateCategories();
  
  const filteredTemplates = INVOICE_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Choose a Template</h2>
              <p className="text-sm text-gray-500">{INVOICE_TEMPLATES.length} professional templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All ({INVOICE_TEMPLATES.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {CATEGORY_ICONS[cat.id]}
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                onClick={() => onSelectTemplate(template)}
                className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  currentTemplate === template.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                {/* Template Preview */}
                <div 
                  className="aspect-[3/4] relative"
                  style={{ backgroundColor: template.colors.background }}
                >
                  {/* Mini Invoice Preview */}
                  <div className="absolute inset-2 rounded-lg overflow-hidden shadow-sm bg-white/90 p-3">
                    {/* Header */}
                    <div 
                      className="h-8 rounded mb-2"
                      style={{ 
                        backgroundColor: template.layout.headerStyle === 'full' 
                          ? template.colors.primary 
                          : 'transparent',
                        borderBottom: template.layout.headerStyle !== 'full' 
                          ? `2px solid ${template.colors.primary}` 
                          : 'none'
                      }}
                    />
                    
                    {/* Content Lines */}
                    <div className="space-y-1.5">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i}
                          className="h-2 rounded"
                          style={{ 
                            backgroundColor: template.colors.text + '20',
                            width: `${100 - i * 15}%`
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Items */}
                    <div className="mt-3 space-y-1">
                      {[1, 2].map(i => (
                        <div 
                          key={i}
                          className="h-4 rounded"
                          style={{ 
                            backgroundColor: template.layout.itemsStyle === 'striped' && i % 2 === 0
                              ? template.colors.primary + '10'
                              : template.colors.text + '10',
                            border: template.layout.itemsStyle === 'bordered' 
                              ? `1px solid ${template.colors.text}20` 
                              : 'none'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Total */}
                    <div 
                      className="mt-auto h-6 rounded mt-3"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                  </div>

                  {/* Selected Checkmark */}
                  {currentTemplate === template.id && (
                    <div className="absolute top-2 right-2 p-1.5 bg-blue-600 rounded-full">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  {hoveredTemplate === template.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-900">
                        Use This Template
                      </span>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-3 bg-white">
                  <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                  
                  {/* Color Swatches */}
                  <div className="flex items-center gap-1 mt-2">
                    {[template.colors.primary, template.colors.secondary, template.colors.accent].map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-auto">
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No templates match your search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Templates are fully customizable after selection
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
