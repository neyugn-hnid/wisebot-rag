import React from 'react';
import { motion } from 'motion/react';

type PageLoadingProps = {
  message?: string;
  className?: string;
};

export default function PageLoading({
  message = 'Đang chuyển hướng...',
  className = '',
}: PageLoadingProps) {
  return (
    <div className={`absolute inset-0 z-[100] w-full h-full overflow-hidden flex items-center justify-center bg-[#000000] ${className}`}>
      <div className="flex flex-col items-start justify-center gap-2">
        <motion.div
          animate={{
            opacity: [0.55, 1, 0.55],
            scale: [0.96, 1.03, 0.96],
            filter: [
              'drop-shadow(0 0 8px rgba(59,158,255,0.18))',
              'drop-shadow(0 0 24px rgba(59,158,255,0.42))',
              'drop-shadow(0 0 8px rgba(59,158,255,0.18))',
            ],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(59,158,255,0.22)_0%,rgba(59,158,255,0)_72%)] blur-2xl scale-125" />
          <div className="relative flex items-center justify-center">
            <img
              src="/img/logo.png"
              alt="WiseBot"
              className="w-[128px] object-contain"
            />
          </div>
        </motion.div>

        <motion.p
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-sm font-semibold tracking-wide text-[#d7e8ff]"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
