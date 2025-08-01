/**
 * Clear all auth-related cache and storage
 * Use this to force a fresh auth state
 */
export function clearAuthCache(): void {
  try {
    // Clear localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage key: ${key}`, e);
        }
      });
      
      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.clear();
        } catch (e) {
          console.warn('Failed to clear sessionStorage:', e);
        }
      }
      
      console.log('✅ Auth cache cleared');
    }
  } catch (error) {
    console.error('Failed to clear auth cache:', error);
  }
}

// Global function for browser console
if (typeof window !== 'undefined') {
  (window as any).clearAuthCache = clearAuthCache;
  console.log('💡 Use clearAuthCache() in console to clear auth cache');
}