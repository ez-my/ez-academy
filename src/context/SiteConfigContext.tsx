import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { SiteConfig } from '../types';
import { getSiteConfig, handleFirestoreError, OperationType } from '../lib/firebase';

interface SiteConfigContextType {
  config: SiteConfig | null;
  loading: boolean;
  /** Re-read the config. The site editor calls this after saving. */
  refresh: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: null,
  loading: true,
  refresh: async () => {},
});

const DEFAULT_CONFIG: SiteConfig = {
  id: 'main',
  hero: {
    title: "Master English the EZ Way",
    subtitle: "SPM, MUET, speaking, writing, and AI-powered practice in one platform. Designed for fast improvement and unbreakable confidence.",
    ctaText: "Try EZ English",
    secondaryCtaText: "Start Free Trial"
  },
  features: {
    title: "Your Study Tools",
    subtitle: "Four simple study tools to help you build confidence and pass SPM and MUET English.",
    items: [
      { id: 'speak', title: 'SpeakEZ', iconName: 'Mic', desc: 'SPM and MUET speaking practice with friendly AI examiners and instant speaking feedback.', highlight: true },
      { id: 'write', title: 'WriteEZ', iconName: 'PenTool', desc: 'Essay feedback checking your grammar, word choice, and linking words.', highlight: false },
      { id: 'read', title: 'ReadEZ', iconName: 'BookOpen', desc: 'Exam-style reading practice to build your speed and comprehension.', highlight: false },
      { id: 'listen', title: 'ListenEZ', iconName: 'Headphones', desc: 'Audio practice to build your listening skills for exam questions.', highlight: false }
    ]
  },
  colors: {
    primary: "#CCFF00",
    obsidian: "#0A0A0A"
  },
  contact: {
    email: "support@ez-academy.my",
    whatsapp: "+6011-10043567",
    address: "Kuala Lumpur, Malaysia"
  },
  seo: {
    metaTitle: "EZ Academy | Master English",
    metaDescription: "Your practical English learning platform",
    ogImage: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1200&h=630",
    keywords: "English Academy, Malaysia Education, SPM English, MUET, Speak English, EZ Academy"
  },
  sectionLayout: [
    { id: 'hero', label: 'Main Hero Header', enabled: true },
    { id: 'promo', label: 'Promo Explainer Video', enabled: true },
    { id: 'story', label: 'The EZ Story (Comic)', enabled: true },
    { id: 'benefits', label: 'The Advantage Benefits', enabled: true },
    { id: 'how-it-works', label: 'Step-by-Step Guide', enabled: true },
    { id: 'vision', label: 'Study Preview Clips', enabled: true },
    { id: 'pricing', label: 'Study Plans', enabled: true },
    { id: 'testimonials', label: 'Student Reviews', enabled: true },
    { id: 'faq', label: 'Frequently Asked Questions', enabled: true },
    { id: 'ecosystem', label: 'How Everything Works', enabled: true },
    { id: 'founder', label: 'About the Founder', enabled: true },
    { id: 'cta', label: 'Get Started', enabled: true },
    { id: 'custom', label: 'Custom Content Layers', enabled: true }
  ],
  media: {
    promoVideo: "",
    backgroundAudio: "",
    audioTitle: ""
  },
  contentSections: [
    {
      id: 'about',
      title: 'About EZ Academy',
      content: '<h2>Our Mission</h2><p>We are dedicated to making English mastery accessible and effective for every Malaysian student.</p>',
      showInNav: true
    }
  ],
  updatedAt: Date.now()
};

const simpleText = (value: SiteConfig): SiteConfig => {
  let text=JSON.stringify(value);
  text=text.split("Your English Arsenal").join("Your English Study Tools");
  text=text.split("Four specialized modules designed to target every core competency required for SPM, MUET, and real-world fluency.").join("Four practice tools to help you improve your English for SPM, MUET, and daily life.");
  text=text.split("SPM & MUET speaking simulator with AI examiner personas and instant fluency scoring.").join("SPM and MUET speaking practice with AI speakers and helpful feedback.");
  text=text.split("Automated essay correction covering grammar, vocabulary range, and cohesive structures.").join("Essay feedback on grammar, word choice, and linking words.");
  text=text.split("Adaptive reading comprehension practice mirroring real examination formats.").join("Exam-style reading practice to help you understand texts.");
  text=text.split("Immersive audio training to hone your listening accuracy under time pressure.").join("Listening practice to help you understand spoken English in the exam.");
  text=text.split("Invest in your fluency").join("Choose your study plan");
  text=text.split("For casual daily touchpoints").join("For short daily practice");
  text=text.split('THE ARCHITECT').join('ABOUT THE FOUNDER');
  text=text.split('AI VISION OUTPUT').join('LEARNING VIDEO');
  text=text.split('AI VISION').join('LEARNING VIDEOS');
  text=text.split('Engage with high-impact tasks.').join('Complete useful practice activities.');
  text=text.split('Get instant, CEFR-aligned scoring.').join('Get feedback and an English level score.');
  text=text.split("Four transparent tiers. Upgrade whenever you need the extra depth, scale down when you don't.").join('Choose the plan that fits your study needs.');
  text=text.split('Intensive exam prep').join('More exam practice');
  text=text.split('Unlimited mastery').join('More daily practice');
  text=text.split('Deep Feedback Mode').join('Detailed feedback');
  text=text.split('Top up on demand').join('Buy extra credits');
  text=text.split('Access to credit usage').join('Use credits for extra practice');
  text=text.split('unbreakable confidence').join('more confidence');
  return JSON.parse(text);
};

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // A one-shot read, not an onSnapshot listener. Site config changes when an admin
  // saves the site editor, which is rare, so a standing listener made every visitor
  // -- signed in or not -- hold an open Firestore stream for an update they would
  // never see. The editor calls refresh() after saving instead.
  const load = useCallback(async () => {
    try {
      const data = await getSiteConfig();
      setConfig(data ? simpleText(data) : DEFAULT_CONFIG);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'settings/main');
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Update CSS Variables based on colors
  useEffect(() => {
    if (config?.colors) {
      document.documentElement.style.setProperty('--primary-hex', config.colors.primary);
      document.documentElement.style.setProperty('--obsidian-hex', config.colors.obsidian);
      
      // Convert hex to RGB for tailwind variables if needed
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
          `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
          '0, 0, 0';
      };
      
      document.documentElement.style.setProperty('--primary-rgb', hexToRgb(config.colors.primary));
    }
  }, [config]);

  return (
    // Children render straight away against DEFAULT_CONFIG. Gating them on the read
    // meant nothing on the page -- not even the marketing home, which reads no config
    // at all -- could paint until Firebase had loaded, initialised and answered.
    <SiteConfigContext.Provider value={{ config: config || DEFAULT_CONFIG, loading, refresh: load }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
