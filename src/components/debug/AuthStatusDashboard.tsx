"use client";

import React, { useState, useEffect } from 'react';
import { authClient } from '@/lib/authClient';
import { createClient } from '@/utils/supabase/client';

/**
 * Auth Status Dashboard - Like big companies use for monitoring
 * Shows real-time auth health, token status, and recent activity
 */
export const AuthStatusDashboard: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [authHealth, setAuthHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          const timeLeft = expiresAt - now;
          const minutesLeft = Math.floor(timeLeft / 60000);

          setTokenInfo({
            hasToken: true,
            expiresAt: new Date(expiresAt),
            minutesLeft,
            isExpiringSoon: minutesLeft < 10,
            user: session.user?.email
          });

          // Determine health status
          if (minutesLeft < 2) {
            setAuthHealth('error');
          } else if (minutesLeft < 10) {
            setAuthHealth('warning');
          } else {
            setAuthHealth('healthy');
          }
        } else if (session && !session.expires_at) {
          // Session exists but no expiration info
          setTokenInfo({
            hasToken: true,
            expiresAt: null,
            minutesLeft: null,
            isExpiringSoon: false,
            user: session.user?.email
          });
          setAuthHealth('warning'); // No expiration info is concerning
        } else {
          setTokenInfo({ hasToken: false });
          setAuthHealth('error');
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        setAuthHealth('error');
      }
    };

    // Update immediately and then every 30 seconds
    updateStatus();
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, [supabase]);

  const getHealthColor = () => {
    switch (authHealth) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const testAuthFetch = async () => {
    try {
      setRequestCount(prev => prev + 1);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (backendUrl) {
        const response = await authClient.fetch(`${backendUrl}/subscription/subscription-status`);
        console.log('Test request successful:', response.status);
        
        if (response.status === 200) {
          setLastRefresh(new Date());
        }
      }
    } catch (error) {
      console.error('Test request failed:', error);
    }
  };

  const forceRefresh = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Force refresh failed:', error);
      } else {
        console.log('Token force refreshed');
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Force refresh error:', error);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Auth Status</h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor()}`}>
          {authHealth.toUpperCase()}
        </div>
      </div>

      {tokenInfo ? (
        <div className="space-y-2 text-xs text-gray-600">
          {tokenInfo.hasToken ? (
            <>
              <div>User: {tokenInfo.user}</div>
              <div>Expires: {tokenInfo.expiresAt?.toLocaleTimeString() || 'Unknown'}</div>
              <div className={tokenInfo.isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                Time left: {tokenInfo.minutesLeft !== null ? `${tokenInfo.minutesLeft} minutes` : 'Unknown'}
              </div>
              {lastRefresh && (
                <div>Last refresh: {lastRefresh.toLocaleTimeString()}</div>
              )}
              <div>Requests made: {requestCount}</div>
            </>
          ) : (
            <div className="text-red-600">No active session</div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-xs">Loading...</div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={testAuthFetch}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
        >
          Test API
        </button>
        <button
          onClick={forceRefresh}
          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
        >
          Refresh
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Enterprise Auth Client v1.0
      </div>
    </div>
  );
};