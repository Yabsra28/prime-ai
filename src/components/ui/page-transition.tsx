'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/lib/animations';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Unique key to trigger enter/exit animations on tab change */
  transitionKey?: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey = 'page',
  className = '',
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={transitionKey}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
