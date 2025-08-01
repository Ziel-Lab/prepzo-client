"use client";

/**
 * Production auth state manager to prevent race conditions during logout
 */
class AuthStateManager {
  private isLoggingOut = false;
  private refreshTimers: Set<NodeJS.Timeout> = new Set();
  private authOperations: Set<Promise<any>> = new Set();

  /**
   * Start logout process - this stops all refresh operations
   */
  startLogout(): void {
    this.isLoggingOut = true;
    
    // Clear all active refresh timers
    this.refreshTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.refreshTimers.clear();
    
    // Cancel pending auth operations
    this.authOperations.clear();
  }

  /**
   * Complete logout process
   */
  completeLogout(): void {
    this.isLoggingOut = false;
  }

  /**
   * Check if currently logging out
   */
  isCurrentlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  /**
   * Register a refresh timer (so we can cancel it during logout)
   */
  registerRefreshTimer(timer: NodeJS.Timeout): void {
    if (this.isLoggingOut) {
      clearTimeout(timer);
      return;
    }
    this.refreshTimers.add(timer);
  }

  /**
   * Unregister a refresh timer
   */
  unregisterRefreshTimer(timer: NodeJS.Timeout): void {
    this.refreshTimers.delete(timer);
  }

  /**
   * Register an auth operation
   */
  registerAuthOperation<T>(operation: Promise<T>): Promise<T | null> {
    if (this.isLoggingOut) {
      return Promise.resolve(null);
    }
    
    this.authOperations.add(operation);
    
    // Clean up when operation completes
    operation.finally(() => {
      this.authOperations.delete(operation);
    }).catch(() => {
      // Ensure errors don't leak
    });
    
    return operation;
  }

  /**
   * Check if auth operations should be blocked
   */
  shouldBlockAuthOperations(): boolean {
    return this.isLoggingOut;
  }

  /**
   * Emergency stop - cancel everything
   */
  emergencyStop(): void {
    this.isLoggingOut = true;
    
    this.refreshTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.refreshTimers.clear();
    this.authOperations.clear();
  }
}

// Global singleton instance
export const authStateManager = new AuthStateManager();

/**
 * Decorator/wrapper for auth operations that respects logout state
 */
export function withAuthOperationCheck<T extends (...args: any[]) => Promise<any>>(
  operation: T
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | null> {
  return async (...args: Parameters<T>) => {
    if (authStateManager.shouldBlockAuthOperations()) {
      console.log('🚫 Auth operation blocked - logout in progress');
      return null;
    }
    
    return authStateManager.registerAuthOperation(operation(...args));
  };
}

/**
 * Safe timer that can be cancelled during logout
 */
export function createSafeRefreshTimer(
  callback: () => void | Promise<void>,
  delay: number
): NodeJS.Timeout | null {
  if (authStateManager.shouldBlockAuthOperations()) {
    return null;
  }
  
  const timer = setTimeout(async () => {
    authStateManager.unregisterRefreshTimer(timer);
    
    if (!authStateManager.shouldBlockAuthOperations()) {
      await callback();
    }
  }, delay);
  
  authStateManager.registerRefreshTimer(timer);
  return timer;
}