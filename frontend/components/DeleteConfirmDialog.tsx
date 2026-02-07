'use client';

import { useEffect } from 'react';
import type { Task } from '@/lib/api/types';
import { useLanguage } from './LanguageProvider';

interface DeleteConfirmDialogProps {
  task: Task;
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
  error?: string | null;
}

export function DeleteConfirmDialog({
  task,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}: DeleteConfirmDialogProps) {
  const { t } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={() => !isDeleting && onCancel()}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl animate-scaleIn overflow-hidden">
        {/* Header with danger gradient */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-500 to-rose-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-xl font-bold text-white">{t('deleteDialog.title')}</h2>
              <p className="text-sm text-white/70">{t('deleteDialog.cannotUndo')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p id="delete-dialog-description" className="text-slate-600 dark:text-slate-400 mb-4">
            {t('deleteDialog.confirmMessage')}
          </p>

          {/* Task preview */}
          <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-4">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
            {task.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{task.description}</p>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {t('deleteDialog.warning')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="btn-secondary"
            >
              {t('deleteDialog.keepTask')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="btn-danger flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t('deleteDialog.deleting')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{t('deleteDialog.deleteTask')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
