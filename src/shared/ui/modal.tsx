'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.18 }}
        className="max-h-[86vh] w-full max-w-2xl overflow-auto border border-hairline bg-background p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium">{title}</h2>
          <button className="text-sm text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" onClick={onClose} aria-label="Close modal">
            Esc
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
