'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Thin top progress bar shown during page navigations
export function PageProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);
  const prevPathRef = useRef(pathname + searchParams.toString());

  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (current !== prevPathRef.current) {
      prevPathRef.current = current;
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
      const t = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return;
      setIsLoading(true);
      setProgress(10);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) { clearInterval(intervalRef.current); return 85; }
          return p + Math.random() * 8;
        });
      }, 200);
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const widthStyle = progress + '%';

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] origin-left"
          style={{ pointerEvents: 'none' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: widthStyle,
              background: 'linear-gradient(90deg, #C9A882, #D4B896, #C9A882)',
              boxShadow: '0 0 8px rgba(201,168,130,0.6)',
            }}
            animate={{ width: widthStyle }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
