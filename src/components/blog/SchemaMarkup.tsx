
import { useEffect } from 'react';

interface SchemaMarkupProps {
  articleSchema: any;
}

export const SchemaMarkup = ({ articleSchema }: SchemaMarkupProps) => {
  useEffect(() => {
    // Remove existing schema scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add article schema
    const articleScript = document.createElement('script');
    articleScript.type = 'application/ld+json';
    articleScript.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(articleScript);

    // Add FAQ schema if provided
    

    return () => {
      // Cleanup on unmount
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [articleSchema]);

  return null;
};
