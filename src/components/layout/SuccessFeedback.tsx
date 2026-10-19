import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessFeedbackProps {
  show: boolean;
  onComplete?: () => void;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({ show, onComplete }) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-[200]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.8 }}
            className="p-8 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-xl shadow-2xl shadow-primary/40 relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-primary/30"
            />
            <CheckCircle2 size={64} className="text-primary relative z-10" />
            
            {/* Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  x: Math.cos((i * 45) * Math.PI / 180) * 80, 
                  y: Math.sin((i * 45) * Math.PI / 180) * 80,
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
