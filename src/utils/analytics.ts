// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: any
    ) => void;
  }
}

// Google Analytics configuration ID
const GA_TRACKING_ID = 'G-0X56SMJDT3';

// Set User ID for logged-in users
export const setAnalyticsUserId = (userId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_id: userId,
    });
    
    // Also send a login event
    window.gtag('event', 'login', {
      user_id: userId,
    });
  }
};

// Clear User ID when user logs out
export const clearAnalyticsUserId = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_id: null,
    });
    
    // Send logout event
    window.gtag('event', 'logout');
  }
};

// Track page views with user ID (if available)
export const trackPageView = (url: string, userId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const config: any = {
      page_location: url,
    };
    
    if (userId) {
      config.user_id = userId;
    }
    
    window.gtag('event', 'page_view', config);
  }
};

// Track custom events with user ID
export const trackEvent = (eventName: string, parameters?: any, userId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const eventData = {
      ...parameters,
      ...(userId && { user_id: userId }),
    };
    
    window.gtag('event', eventName, eventData);
  }
}; 