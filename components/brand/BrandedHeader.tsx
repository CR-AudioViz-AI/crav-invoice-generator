'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { AuthButtons } from './AuthButtons';
import { CreditsBar } from './CreditsBar';
import { CentralServices } from '@/lib/central-services';

interface BrandedHeaderProps {
  appName: string;
  appLogo?: React.ReactNode;
  quickLinks?: Array<{ label: string; href: string }>;
}

type PlanType = 'free' | 'pro' | 'business';

/**
 * Branded Header Component
 * 
 * Standard header for all CR AudioViz AI apps with:
 * - App logo (3D style)
 * - Quick links
 * - Theme toggle (innocuous)
 * - Auth buttons (Log In/Sign Up or User Name/Log Out)
 * - Credits bar (when logged in)
 */
export function BrandedHeader({ appName, appLogo, quickLinks = [] }: BrandedHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState<PlanType>('free');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const session = await CentralServices.Auth.getSession();
      if (session.success && session.data) {
        setIsLoggedIn(true);
        setUser({
          name: session.data.name,
          email: session.data.email,
        });
        
        // Fetch credits
        const creditsResult = await CentralServices.Credits.getBalance();
        if (creditsResult.success) {
          setCredits(creditsResult.data?.balance || 0);
          const tier = creditsResult.data?.tier;
          setPlan((tier === 'pro' || tier === 'business' ? tier : 'free') as PlanType);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCredits(0);
    CentralServices.Auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            {appLogo || (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                {appName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-lg hidden sm:inline-block">{appName}</span>
          </Link>
        </div>

        {/* Quick Links - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side - Auth & Theme */}
        <div className="flex items-center gap-4">
          {isLoggedIn && <CreditsBar credits={credits} plan={plan} />}
          <ThemeToggle />
          <AuthButtons 
            isLoggedIn={isLoggedIn} 
            user={user} 
            onLogout={handleLogout} 
          />
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t p-4 space-y-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
