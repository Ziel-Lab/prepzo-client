export interface WhiteLabelConfig {
  // Branding
  brandName: string;
  brandLogo: string;
  brandFavicon: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Content
  tagline: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  
  // Features
  enabledFeatures: {
    resumeGenerator: boolean;
    coverLetterGenerator: boolean;
    linkedinOptimizer: boolean;
    mockInterview: boolean;
    jobSearch: boolean;
  };
  
  // Customization
  customDomain?: string;
  partnerId: string;
  analyticsId?: string;
  
  // Contact & Support
  supportEmail: string;
  supportPhone?: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

// Default Prepzo configuration
export const defaultConfig: WhiteLabelConfig = {
  brandName: "Prepzo AI",
  brandLogo: "/static/images/logo.svg",
  brandFavicon: "/static/favicons/favicon.ico",
  primaryColor: "#183723",
  secondaryColor: "#2a5f3e",
  tagline: "Land your dream job faster with AI-powered career tools",
  description: "AI-powered resumes, cover letters, LinkedIn makeovers & job search tools tailored to you.",
  heroTitle: "Master Your Career with AI-Powered Tools",
  heroSubtitle: "Get personalized resume optimization, mock interviews, and career guidance powered by advanced AI.",
  enabledFeatures: {
    resumeGenerator: true,
    coverLetterGenerator: true,
    linkedinOptimizer: true,
    mockInterview: true,
    jobSearch: true,
  },
  partnerId: "prepzo",
  supportEmail: "support@prepzo.ai",
  privacyPolicyUrl: "/privacy-policy",
  termsOfServiceUrl: "/terms-of-service",
};

// Partner configurations
export const partnerConfigs: Record<string, Partial<WhiteLabelConfig>> = {
  // Example partner configuration
  "partner-university": {
    brandName: "CareerHub Pro",
    brandLogo: "/partners/CareerHub/p1.png",
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    tagline: "Professional career development tools for students",
    description: "Comprehensive career tools designed specifically for university students.",
    heroTitle: "Launch Your Career with Professional Tools",
    heroSubtitle: "Access industry-leading career development tools designed for student success.",
    enabledFeatures: {
      resumeGenerator: true,
      coverLetterGenerator: true,
      linkedinOptimizer: true,
      mockInterview: true,
      jobSearch: false, // Disable job search for this partner
    },
    partnerId: "partner-university",
    supportEmail: "careers@university.edu",
    privacyPolicyUrl: "/partners/careerhub/privacy",
    termsOfServiceUrl: "/partners/careerhub/terms",
  },
  
  // Another example
  "corporate-partner": {
    brandName: "TalentBoost",
    brandLogo: "/partners/corparate-partner/p2.png",
    primaryColor: "#dc2626",
    secondaryColor: "#ef4444",
    tagline: "Elevate your team's career development",
    description: "Professional career tools for corporate talent development programs.",
    heroTitle: "Empower Your Team's Career Growth",
    heroSubtitle: "Comprehensive career development tools for corporate talent programs.",
    enabledFeatures: {
      resumeGenerator: true,
      coverLetterGenerator: true,
      linkedinOptimizer: true,
      mockInterview: true,
      jobSearch: true,
    },
    partnerId: "corporate-partner",
    supportEmail: "talent@company.com",
    privacyPolicyUrl: "/partners/talentboost/privacy",
    termsOfServiceUrl: "/partners/talentboost/terms",
  }
};

// Function to get configuration based on environment or subdomain
export function getWhiteLabelConfig(): WhiteLabelConfig {
  // Check for environment variable first
  const partnerId = process.env.NEXT_PUBLIC_PARTNER_ID || 
                   process.env.WHITE_LABEL_PARTNER_ID ||
                   getPartnerFromSubdomain();
  
  if (partnerId && partnerId !== "prepzo" && partnerConfigs[partnerId]) {
    return {
      ...defaultConfig,
      ...partnerConfigs[partnerId],
    } as WhiteLabelConfig;
  }
  
  return defaultConfig;
}

// Helper function to extract partner ID from subdomain
function getPartnerFromSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  // Skip common subdomains
  if (['www', 'app', 'api', 'admin'].includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}
