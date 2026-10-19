import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useSiteConfig } from '../../context/SiteConfigContext';

export const ContentPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config } = useSiteConfig();

  const section = config?.contentSections?.find(s => s.id === slug);

  if (!section) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[80vh] py-32 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-4"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Academy Dossier</div>
          <h1 className="text-2xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter italic">
             {section.title}
          </h1>
          <div className="w-24 h-1 bg-primary rounded-full" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rich-text-content glass-card p-4 sm:p-12 lg:p-20 border-white/5 bg-white/[0.02] leading-relaxed text-white/70"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      </div>
    </div>
  );
};
