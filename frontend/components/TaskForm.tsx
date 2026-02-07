'use client';

import { useState, FormEvent } from 'react';
import type { TaskCreateRequest, Priority } from '@/lib/api/types';
import { DatePicker } from './ui/DatePicker';
import { PrioritySelector } from './ui/PrioritySelector';
import { useLanguage } from './LanguageProvider';
import { Plus, Sparkles, Type, AlignLeft } from 'lucide-react';

interface TaskFormProps {
  onSubmit: (data: TaskCreateRequest) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export function TaskForm({ onSubmit, isSubmitting, error }: TaskFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);

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

    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        due_date: dueDate,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(null);
      setShowDescription(false);
    } catch {
      // Error handled by parent
    }
  };

  const displayError = validationError || error;

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-8">
      {/* Gradient header */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl" />

      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-amber-900" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('taskForm.createTitle')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('taskForm.createSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Title Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Type className="w-4 h-4 text-indigo-500" />
                {t('taskForm.taskTitle')} <span className="text-red-400">*</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('taskForm.titlePlaceholder')}
                  className="w-full px-5 py-4 text-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 group-hover:border-slate-300"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                {title.length > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {title.length}/500
                  </span>
                )}
              </div>
            </div>

            {/* Description (toggleable) */}
            {showDescription ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <AlignLeft className="w-4 h-4 text-indigo-500" />
                  {t('taskForm.description')}
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('taskForm.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 resize-none"
                    disabled={isSubmitting}
                    maxLength={5000}
                    autoFocus
                  />
                  {description.length > 0 && (
                    <span className="absolute right-4 bottom-4 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {description.length}/5000
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDescription(true)}
                className="w-full flex items-center gap-2 px-5 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all duration-200"
              >
                <AlignLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{t('taskForm.addDescription')}</span>
              </button>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('taskForm.priority')}</label>
              <PrioritySelector value={priority} onChange={setPriority} />
            </div>

            {/* Due Date with Calendar */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('taskForm.dueDate')}</label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder={t('taskForm.pickDate')}
              />
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-600">{displayError}</p>
              </div>
            )}

            {/* Add Task Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('taskForm.creating')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>{t('taskForm.addTask')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
