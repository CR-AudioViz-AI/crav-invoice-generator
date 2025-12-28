/**
 * INVOICE TEMPLATES LIBRARY
 * Professional invoice templates for Invoice Generator Pro
 * 
 * @version 1.0.0
 * @date December 27, 2025
 */

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'corporate' | 'industry';
  thumbnail: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    headerStyle: 'full' | 'split' | 'minimal' | 'centered';
    logoPosition: 'left' | 'right' | 'center';
    itemsStyle: 'striped' | 'bordered' | 'clean' | 'cards';
    totalsPosition: 'right' | 'left' | 'center';
  };
  features: string[];
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  // PROFESSIONAL TEMPLATES
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Clean, professional design with blue accents',
    category: 'professional',
    thumbnail: '/templates/modern-blue.png',
    colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    layout: {
      headerStyle: 'split',
      logoPosition: 'left',
      itemsStyle: 'striped',
      totalsPosition: 'right'
    },
    features: ['Logo support', 'QR code', 'Payment link']
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    description: 'Sophisticated dark theme for premium brands',
    category: 'professional',
    thumbnail: '/templates/executive-dark.png',
    colors: {
      primary: '#1f2937',
      secondary: '#111827',
      accent: '#f59e0b',
      text: '#f9fafb',
      background: '#1f2937'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato'
    },
    layout: {
      headerStyle: 'full',
      logoPosition: 'center',
      itemsStyle: 'clean',
      totalsPosition: 'right'
    },
    features: ['Dark mode', 'Gold accents', 'Premium feel']
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    description: 'Traditional business style with serif fonts',
    category: 'professional',
    thumbnail: '/templates/classic-serif.png',
    colors: {
      primary: '#374151',
      secondary: '#4b5563',
      accent: '#059669',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Merriweather',
      body: 'Source Sans Pro'
    },
    layout: {
      headerStyle: 'minimal',
      logoPosition: 'left',
      itemsStyle: 'bordered',
      totalsPosition: 'right'
    },
    features: ['Traditional look', 'Easy to read', 'Print-friendly']
  },

  // MINIMAL TEMPLATES
  {
    id: 'minimalist-white',
    name: 'Minimalist White',
    description: 'Ultra-clean design with lots of whitespace',
    category: 'minimal',
    thumbnail: '/templates/minimalist-white.png',
    colors: {
      primary: '#000000',
      secondary: '#6b7280',
      accent: '#000000',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Helvetica Neue',
      body: 'Helvetica Neue'
    },
    layout: {
      headerStyle: 'minimal',
      logoPosition: 'left',
      itemsStyle: 'clean',
      totalsPosition: 'right'
    },
    features: ['Clean design', 'Maximum whitespace', 'Focus on content']
  },
  {
    id: 'nordic-light',
    name: 'Nordic Light',
    description: 'Scandinavian-inspired minimal design',
    category: 'minimal',
    thumbnail: '/templates/nordic-light.png',
    colors: {
      primary: '#64748b',
      secondary: '#94a3b8',
      accent: '#0ea5e9',
      text: '#334155',
      background: '#f8fafc'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans'
    },
    layout: {
      headerStyle: 'centered',
      logoPosition: 'center',
      itemsStyle: 'clean',
      totalsPosition: 'center'
    },
    features: ['Soft colors', 'Centered layout', 'Modern feel']
  },

  // CREATIVE TEMPLATES
  {
    id: 'gradient-sunset',
    name: 'Gradient Sunset',
    description: 'Bold gradient header with warm colors',
    category: 'creative',
    thumbnail: '/templates/gradient-sunset.png',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#7c3aed',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Nunito'
    },
    layout: {
      headerStyle: 'full',
      logoPosition: 'left',
      itemsStyle: 'cards',
      totalsPosition: 'right'
    },
    features: ['Gradient header', 'Bold colors', 'Creative agencies']
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Dark theme with neon accent colors',
    category: 'creative',
    thumbnail: '/templates/neon-glow.png',
    colors: {
      primary: '#06b6d4',
      secondary: '#8b5cf6',
      accent: '#f472b6',
      text: '#e2e8f0',
      background: '#0f172a'
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter'
    },
    layout: {
      headerStyle: 'split',
      logoPosition: 'left',
      itemsStyle: 'bordered',
      totalsPosition: 'right'
    },
    features: ['Dark mode', 'Neon accents', 'Tech/gaming']
  },
  {
    id: 'watercolor-soft',
    name: 'Watercolor Soft',
    description: 'Artistic design with soft watercolor touches',
    category: 'creative',
    thumbnail: '/templates/watercolor-soft.png',
    colors: {
      primary: '#ec4899',
      secondary: '#a855f7',
      accent: '#06b6d4',
      text: '#374151',
      background: '#fdf4ff'
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Quicksand'
    },
    layout: {
      headerStyle: 'centered',
      logoPosition: 'center',
      itemsStyle: 'clean',
      totalsPosition: 'center'
    },
    features: ['Artistic feel', 'Soft colors', 'Artists/designers']
  },

  // CORPORATE TEMPLATES
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    description: 'Traditional corporate design in navy blue',
    category: 'corporate',
    thumbnail: '/templates/corporate-navy.png',
    colors: {
      primary: '#1e3a5f',
      secondary: '#2c5282',
      accent: '#c53030',
      text: '#1a202c',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Georgia',
      body: 'Arial'
    },
    layout: {
      headerStyle: 'full',
      logoPosition: 'left',
      itemsStyle: 'striped',
      totalsPosition: 'right'
    },
    features: ['Professional', 'Enterprise-ready', 'Traditional']
  },
  {
    id: 'enterprise-green',
    name: 'Enterprise Green',
    description: 'Trustworthy green corporate theme',
    category: 'corporate',
    thumbnail: '/templates/enterprise-green.png',
    colors: {
      primary: '#065f46',
      secondary: '#047857',
      accent: '#10b981',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Roboto',
      body: 'Roboto'
    },
    layout: {
      headerStyle: 'split',
      logoPosition: 'left',
      itemsStyle: 'bordered',
      totalsPosition: 'right'
    },
    features: ['Trust colors', 'Clean lines', 'Finance/consulting']
  },

  // INDUSTRY-SPECIFIC TEMPLATES
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'Modern design for tech companies',
    category: 'industry',
    thumbnail: '/templates/tech-startup.png',
    colors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#06b6d4',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    layout: {
      headerStyle: 'split',
      logoPosition: 'left',
      itemsStyle: 'cards',
      totalsPosition: 'right'
    },
    features: ['Modern', 'Tech-focused', 'SaaS/startups']
  },
  {
    id: 'legal-formal',
    name: 'Legal Formal',
    description: 'Formal template for legal and professional services',
    category: 'industry',
    thumbnail: '/templates/legal-formal.png',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#b91c1c',
      text: '#111827',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Times New Roman',
      body: 'Times New Roman'
    },
    layout: {
      headerStyle: 'minimal',
      logoPosition: 'left',
      itemsStyle: 'bordered',
      totalsPosition: 'right'
    },
    features: ['Formal', 'Print-ready', 'Legal/accounting']
  },
  {
    id: 'construction-bold',
    name: 'Construction Bold',
    description: 'Bold design for construction and trades',
    category: 'industry',
    thumbnail: '/templates/construction-bold.png',
    colors: {
      primary: '#ca8a04',
      secondary: '#a16207',
      accent: '#1f2937',
      text: '#1f2937',
      background: '#fffbeb'
    },
    fonts: {
      heading: 'Oswald',
      body: 'Open Sans'
    },
    layout: {
      headerStyle: 'full',
      logoPosition: 'left',
      itemsStyle: 'striped',
      totalsPosition: 'right'
    },
    features: ['Bold colors', 'Easy to read', 'Trades/construction']
  },
  {
    id: 'healthcare-clean',
    name: 'Healthcare Clean',
    description: 'Clean, trustworthy design for healthcare',
    category: 'industry',
    thumbnail: '/templates/healthcare-clean.png',
    colors: {
      primary: '#0891b2',
      secondary: '#0e7490',
      accent: '#14b8a6',
      text: '#1f2937',
      background: '#ffffff'
    },
    fonts: {
      heading: 'Nunito Sans',
      body: 'Nunito Sans'
    },
    layout: {
      headerStyle: 'split',
      logoPosition: 'left',
      itemsStyle: 'clean',
      totalsPosition: 'right'
    },
    features: ['Clean', 'Trustworthy', 'Healthcare/medical']
  },
  {
    id: 'photography-elegant',
    name: 'Photography Elegant',
    description: 'Elegant design for photographers and creatives',
    category: 'industry',
    thumbnail: '/templates/photography-elegant.png',
    colors: {
      primary: '#78716c',
      secondary: '#57534e',
      accent: '#d97706',
      text: '#1c1917',
      background: '#fafaf9'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lora'
    },
    layout: {
      headerStyle: 'centered',
      logoPosition: 'center',
      itemsStyle: 'clean',
      totalsPosition: 'center'
    },
    features: ['Elegant', 'Portfolio-style', 'Photographers/artists']
  }
];

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): InvoiceTemplate[] {
  return INVOICE_TEMPLATES.filter(t => t.category === category);
}

// Helper function to get template by ID
export function getTemplateById(id: string): InvoiceTemplate | undefined {
  return INVOICE_TEMPLATES.find(t => t.id === id);
}

// Get all categories with counts
export function getTemplateCategories(): { id: string; name: string; count: number }[] {
  const categories = [
    { id: 'professional', name: 'Professional' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'creative', name: 'Creative' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'industry', name: 'Industry-Specific' }
  ];
  
  return categories.map(cat => ({
    ...cat,
    count: INVOICE_TEMPLATES.filter(t => t.category === cat.id).length
  }));
}

export default INVOICE_TEMPLATES;
