import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles } from 'lucide-react';

interface VisionVideoProps {
  title: string;
  description: string;
  videoUrl: string;
  posterUrl?: string;
  badge?: string;
}

export const VisionVideo: React.FC<VisionVideoProps> = React.memo(({ title, description, videoUrl, posterUrl, badge = "AI Vision Output" }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5">
      <div className="aspect-video relative overflow-hidden bg-obsidian">
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'}`}
          loop
          muted
          playsInline
          onEnded={() => setIsPlaying(false)}
        />

        {/* AI Badge */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-obsidian/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
          <Sparkles className="text-primary" size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{badge}</span>
        </div>

        {/* Play Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button 
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-obsidian shadow-2xl shadow-primary/40 active:scale-95 transition-transform"
            >
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
          </div>
        )}

        {/* Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-80" />
      </div>

      <div className="p-8 space-y-3 relative z-10">
        <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{description}</p>
        
        {/* Progress bar simulation when playing */}
        {isPlaying && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 h-1 bg-primary/30"
          />
        )}
      </div>
    </div>
  );
});
