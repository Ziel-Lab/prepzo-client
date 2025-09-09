import { Metadata } from "next";
import { WhiteLabelConfig } from "@/config/white-label";

export function generateWhiteLabelMetadata(config: WhiteLabelConfig): Metadata {
  return {
    title: `${config.brandName}: ${config.tagline}`,
    description: config.description,
    keywords: [
      "career tools",
      "resume generator",
      "mock interview",
      "cover letter generator",
      "linkedin optimization",
      "job search",
      "career development",
      config.brandName.toLowerCase(),
    ],
    manifest: "/static/favicons/site.webmanifest",
    icons: {
      icon: [
        { rel: "icon", url: config.brandFavicon },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          url: config.brandFavicon,
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          url: config.brandFavicon,
        },
      ],
      apple: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          url: config.brandFavicon,
        },
      ],
    },
    openGraph: {
      title: `${config.brandName}: ${config.tagline}`,
      description: config.description,
      url: config.customDomain || "https://www.prepzo.ai/",
      siteName: config.brandName,
      images: [
        {
          url: config.brandLogo,
          width: 1200,
          height: 630,
          alt: `${config.brandName} preview`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.brandName}: ${config.tagline}`,
      description: config.description,
      images: [config.brandLogo],
      site: `@${config.brandName.toLowerCase().replace(/\s+/g, '_')}`,
    },
    alternates: {
      canonical: config.customDomain || "https://www.prepzo.ai/",
    },
  };
}

export function generateStructuredData(config: WhiteLabelConfig) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${config.brandName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${config.brandName} is an AI-powered career development platform that provides personalized tools for job search, skill development and career growth.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${config.brandName} free to try?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can explore our tools with a free demo without providing a credit card.",
        },
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.brandName,
    url: config.customDomain || "https://www.prepzo.ai",
    publisher: {
      "@type": "Organization",
      name: config.brandName,
      url: config.customDomain || "https://www.prepzo.ai",
      logo: {
        "@type": "ImageObject",
        url: config.brandLogo,
      },
    },
    description: config.description,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    url: config.customDomain || "https://www.prepzo.ai/",
    name: config.brandName,
    logo: config.brandLogo,
    sameAs: [
      "https://www.linkedin.com/company/prepzo-ai/",
    ],
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.brandName,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description: config.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: config.customDomain || "https://www.prepzo.ai/",
    image: config.brandLogo,
  };

  return {
    faqSchema,
    websiteSchema,
    organizationSchema,
    softwareApplicationSchema,
  };
}
