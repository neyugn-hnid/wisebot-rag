import React from 'react';
import { Trash2, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#000000]/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[#050505] shadow-[0_28px_90px_rgba(0,0,0,0.62)] animate-in zoom-in-95 duration-200">
        <button
          disabled={isDeleting}
          onClick={onClose}
          className="absolute right-5 top-5 rounded-[12px] p-2 text-[#a1a4a5] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ffffff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="mb-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[#f00000]/20 bg-[#f00000]/10 text-[#f00000]">
            {isDeleting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f00000]/30 border-t-[#f00000]" />
            ) : (
              <Trash2 size={22} />
            )}
          </div>
          <div className="w-full max-w-[26rem] space-y-3">
            <h3 className="text-[24px] font-display font-medium tracking-tight text-[#f5f5f5]">
              {title}
            </h3>
            <div className="text-sm leading-7 text-[#a1a4a5]">
              {description}
              <span className="block text-[#f00000]">
                {warningText || t('common.cannot_be_undone') || "This action cannot be undone."}
              </span>
            </div>
          </div>
          <div className="mt-7 flex w-full gap-3">
            <button 
              disabled={isDeleting}
              onClick={onClose}
              className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] py-3 text-sm font-semibold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText || t('common.cancel')}
            </button>
            <button 
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#f00000] py-3 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#e00000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {confirmText || t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
