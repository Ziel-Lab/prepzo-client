/**
 * Force auth refresh utility
 * Call this to immediately refresh tokens and fix 401 errors
 */
import { createClient } from '@/utils/supabase/client';

export async function forceAuthRefresh(): Promise<boolean> {
  try {
    console.log('🚨 Force refreshing auth tokens...');
    
    const supabase = createClient();
    
    // Clear any stale data
    await supabase.auth.refreshSession();
    
    // Wait for refresh to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify we have a valid session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('❌ Force refresh failed:', error);
      return false;
    }
    
    console.log('✅ Force refresh successful');
    return true;
    
  } catch (error) {
    console.error('❌ Force refresh error:', error);
    return false;
  }
}

// Auto-execute on import
if (typeof window !== 'undefined') {
  // Add to window for console access
  (window as any).forceAuthRefresh = forceAuthRefresh;
  
  // Auto-execute on page load
  setTimeout(() => {
    forceAuthRefresh();
  }, 1000);
}