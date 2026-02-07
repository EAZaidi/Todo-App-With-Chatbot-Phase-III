'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import type { Task, TaskUpdateRequest, Priority } from '@/lib/api/types';
import { DatePicker } from './ui/DatePicker';
import { PrioritySelector } from './ui/PrioritySelector';
import { useLanguage } from './LanguageProvider';
import { Pencil, X, Check, Loader2 } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onSave: (data: TaskUpdateRequest) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  error?: string | null;
}

export function EditTaskModal({ task, isOpen, onSave, onClose, isSaving, error }: EditTaskModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority || 'medium');
  const [dueDate, setDueDate] = useState<string | null>(task.due_date || null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setDueDate(task.due_date || null);
    setValidationError(null);
  }, [task]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError(t('taskForm.titleRequired'));
      return;
    }
    if (trimmedTitle.length > 500) {
      setValidationError(t('taskForm.titleMaxLength'));
      return;
    }
    if (description.length > 5000) {
      setValidationError(t('taskForm.descMaxLength'));
      return;
    }

    await onSave({
      title: trimmedTitle,
      description: description.trim() || null,
      completed: task.completed,
      priority,
      due_date: dueDate,
    });
  };

  const displayError = validationError || error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl">
          <button
            onClick={() => !isSaving && onClose()}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Pencil className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="edit-modal-title" className="text-2xl font-bold text-white">{t('editModal.title')}</h2>
              <p className="text-sm text-white/80">{t('editModal.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="edit-title" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('editModal.titleLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                  disabled={isSaving}
                  maxLength={500}
                  placeholder={t('editModal.titlePlaceholder')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {title.length}/500
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-description" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('editModal.description')}
              </label>
              <div className="relative">
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 resize-none"
                  disabled={isSaving}
                  maxLength={5000}
                  placeholder={t('editModal.descPlaceholder')}
                />
                <span className="absolute right-4 bottom-4 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {description.length}/5000
                </span>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('editModal.priority')}</label>
              <PrioritySelector value={priority} onChange={setPriority} />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('editModal.dueDate')}</label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder={t('editModal.setDeadline')}
                openDirection="up"
              />
            </div>

            {/* Error */}
            {displayError && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-600">{displayError}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {t('editModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('editModal.saving')}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{t('editModal.saveChanges')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
