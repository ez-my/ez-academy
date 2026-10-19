import React, { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';

interface SEOSyncProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export const SEOSync: React.FC<SEOSyncProps> = ({ title, description, keywords, ogImage }) => {
  const { config } = useSiteConfig();

  useEffect(() => {
    const finalTitle = title || config?.seo?.metaTitle || 'EZ Academy';
    const finalDescription = description || config?.seo?.metaDescription || '';
    const finalKeywords = keywords || config?.seo?.keywords || '';
    const finalOgImage = ogImage || config?.seo?.ogImage || '';

    // Update Title
    document.title = finalTitle;

    // Update Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', finalDescription);

    // Update Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', finalKeywords);

    // Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: finalTitle },
      { property: 'og:description', content: finalDescription },
      { property: 'og:image', content: finalOgImage },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://ez-academy.my' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: finalTitle },
      { name: 'twitter:description', content: finalDescription },
      { name: 'twitter:image', content: finalOgImage },
    ];

    ogTags.forEach(tag => {
      const selector = tag.property ? `meta[property="${tag.property}"]` : `meta[name="${tag.name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (tag.property) element.setAttribute('property', tag.property);
        if (tag.name) element.setAttribute('name', tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });

    // Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://ez-academy.my' + window.location.pathname);

  }, [config?.seo, title, description, keywords, ogImage]);

  return null; // Side-effect only component
};
