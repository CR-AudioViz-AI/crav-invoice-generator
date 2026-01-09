'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserPlan {
  tier: string;
  credits: number;
}

export function BrandedHeader() {
  const { data: session } = useSession();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserPlan() {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/credits');
        if (response.ok) {
          const data = await response.json();
          // Access 'tier' property, not 'plan'
          setUserPlan({
            tier: data.tier || 'free',
            credits: data.credits || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch user plan:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPlan();
  }, [session?.user?.email]);

  // Extract user name directly from session.data
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold hover:opacity-90 transition-opacity">
              CR AudioViz AI
            </Link>
          </div>

          <nav className="flex items-center space-x-6">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              Home
            </Link>
            <Link href="/pricing" className="hover:opacity-90 transition-opacity">
              Pricing
            </Link>
            
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium">{userName}</div>
                  {!isLoading && userPlan && (
                    <div className="text-xs opacity-90">
                      {userPlan.tier.charAt(0).toUpperCase() + userPlan.tier.slice(1)} Plan • {userPlan.credits} credits
                    </div>
                  )}
                </div>
                <Link
                  href="/api/auth/signout"
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
                >
                  Sign Out
                </Link>
              </div>
            ) : (
              <Link
                href="/api/auth/signin"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
