'use client';

import type React from 'react';
import { DetachedSheet } from '@/components/ui/detached-sheet';

interface ModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}

export const Modal = ({ open, setOpen, children }: ModalProps) => {
  return (
    <DetachedSheet open={open} setOpen={setOpen}>
      {children}
    </DetachedSheet>
  );
};