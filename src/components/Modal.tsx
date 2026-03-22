import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, children, width = 'w-[500px]' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(10,30,18,0.45)] backdrop-blur-[3px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-card rounded-[20px] p-9 ${width} max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_rgba(10,30,18,0.25)] border border-border animate-fade-in`}>
        {children}
      </div>
    </div>
  );
}
