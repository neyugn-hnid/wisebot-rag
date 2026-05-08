import React from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title: string;
  description: string;
  warningText?: string;
  cancelText?: string;
  confirmText?: string;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title,
  description,
  warningText,
  cancelText,
  confirmText,
}: DeleteModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#ff0000]/10 text-[#ff0000]">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-black text-[#f0f0f0] mb-2">
            {title}
          </h3>
          <p className="text-sm text-[#a1a4a5] leading-relaxed">
            {description}
            <span className="text-[#ff0000] block mt-2">
              {warningText || t('common.cannot_be_undone') || "This action cannot be undone."}
            </span>
          </p>
        </div>
        <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(44,44,46,0.92)] flex gap-3">
          <button 
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff] rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button 
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-bold text-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/40 bg-[#ff0000] hover:bg-[#ff0000]/90 hover:text-white shadow-[0_0_15px_rgba(255,0,0,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {confirmText || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
