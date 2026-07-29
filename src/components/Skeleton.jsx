import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ className = '', style = {} }) {
  return (
    <motion.div
      className={`bg-outline-variant/30 rounded-lg ${className}`}
      style={style}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
