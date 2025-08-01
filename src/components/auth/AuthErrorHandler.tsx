"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Global auth error handler component
 * Catches authentication errors and provides recovery options
 */
export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ children }) => {
  const { isAuthenticated, isLoading, triggerAuthCheck, logout } = useAuth();
  const [hasAuthError, setHasAuthError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Listen for global auth errors
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      console.log('Global auth error detected:', event.detail);
      setHasAuthError(true);
    };

    window.addEventListener('auth-error', handleAuthError as EventListener);
    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener);
    };
  }, []);

  // Reset error state when authentication is restored
  useEffect(() => {
    if (isAuthenticated) {
      setHasAuthError(false);
    }
  }, [isAuthenticated]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await triggerAuthCheck();
      setHasAuthError(false);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setHasAuthError(false);
    // Redirect to login page
    window.location.href = '/auth/login';
  };

  // Show error overlay if there's an auth error
  if (hasAuthError && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your session has expired or authentication failed. Please try refreshing your session or log in again.
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              variant="outline"
              className="flex-1"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Retry
            </Button>
            
            <Button 
              onClick={handleLogout}
              variant="default"
              className="flex-1"
            >
              Login Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Hook to dispatch global auth errors
 */
export const useAuthErrorHandler = () => {
  const dispatchAuthError = (error: Error | string) => {
    const event = new CustomEvent('auth-error', {
      detail: typeof error === 'string' ? error : error.message
    });
    window.dispatchEvent(event);
  };

  return { dispatchAuthError };
};