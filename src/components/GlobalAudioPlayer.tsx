import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';

export const GlobalAudioPlayer: React.FC = () => {
  const { config } = useSiteConfig();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (config?.media?.backgroundAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(config.media.backgroundAudio);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== config.media.backgroundAudio) {
        audioRef.current.src = config.media.backgroundAudio;
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [config?.media?.backgroundAudio]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
    }
    setIsPlaying(!isPlaying);
    setHasInteracted(true);
  };

  if (!config?.media?.backgroundAudio) return null;

  return (
    <div className="fixed bottom-8 left-8 z-[60] flex items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={togglePlay}
        className="w-12 h-12 rounded-full bg-obsidian border border-white/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] transition-all"
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} className="text-white/40" />}
      </motion.button>
      
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-4 py-2 bg-obsidian/80 backdrop-blur-md border border-white/5 rounded-2xl flex items-center gap-3"
          >
            <div className="flex gap-1 items-end h-3">
              {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-primary rounded-full"
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-primary tracking-widest leading-none mb-1">Now Streaming</p>
              <p className="text-[10px] font-bold text-white truncate max-w-[120px]">{config.media?.audioTitle || 'Ambient Learning'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
