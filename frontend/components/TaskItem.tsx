'use client';

import type { Task, Priority } from '@/lib/api/types';
import { formatRelativeDate } from '@/lib/utils/date';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { useLanguage } from './LanguageProvider';
import { Check, Pencil, Trash2, Clock, Calendar, Flag, AlertCircle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPending?: boolean;
}

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: {
    label: 'Low',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  high: {
    label: 'High',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200'
  },
};

function getDueDateInfo(dueDate: string | null, t: (key: string) => string): { text: string; isOverdue: boolean; isUrgent: boolean } | null {
  if (!dueDate) return null;

  const date = parseISO(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (isToday(date)) {
    return { text: t('taskItem.dueToday'), isOverdue: false, isUrgent: true };
  }
  if (isTomorrow(date)) {
    return { text: t('taskItem.dueTomorrow'), isOverdue: false, isUrgent: true };
  }
  if (isPast(date)) {
    return { text: `${t('taskItem.overdue')}: ${format(date, 'MMM d')}`, isOverdue: true, isUrgent: false };
  }
  return { text: format(date, 'MMM d, yyyy'), isOverdue: false, isUrgent: false };
}

export function TaskItem({ task, onToggleComplete, onEdit, onDelete, isPending = false }: TaskItemProps) {
  const { t, language } = useLanguage();
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const priorityLabel = t(`taskItem.${task.priority}`) || priority.label;
  const dueDateInfo = getDueDateInfo(task.due_date, t);

  return (
    <div
      className={`group relative rounded-2xl border-2 transition-all duration-300 ${
        isPending ? 'opacity-60 pointer-events-none' : ''
      } ${task.completed
          ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-500/10 hover:-translate-y-1'
      }`}
    >
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 rtl:left-auto rtl:right-0 w-1 h-full rounded-l-2xl rtl:rounded-l-none rtl:rounded-r-2xl transition-opacity duration-300 ${
        task.completed ? 'opacity-30' : ''
      } ${
        task.priority === 'high' ? 'bg-gradient-to-b from-rose-400 to-rose-500' :
        task.priority === 'medium' ? 'bg-gradient-to-b from-amber-400 to-amber-500' :
        'bg-gradient-to-b from-emerald-400 to-emerald-500'
      }`} />

      <div className="p-5 pl-6 rtl:pl-5 rtl:pr-6">
        <div className="flex items-start gap-4">
          {/* Custom Checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={task.completed}
            onClick={onToggleComplete}
            disabled={isPending}
            className={`relative flex-shrink-0 mt-0.5 h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
              task.completed
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-transparent shadow-lg shadow-emerald-500/30'
                : 'border-slate-300 hover:border-indigo-500 hover:shadow-md hover:scale-110'
            } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={task.completed ? t('taskItem.markIncomplete') : t('taskItem.markComplete')}
          >
            <Check
              className={`h-4 w-4 text-white transition-all duration-300 ${
                task.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              strokeWidth={3}
            />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold transition-all duration-300 ${
                  task.completed
                    ? 'text-slate-500 dark:text-slate-400 line-through'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className={`mt-2 text-sm leading-relaxed transition-all duration-300 ${
                    task.completed
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={isPending}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50"
                  aria-label={t('taskItem.editTask')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isPending}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50"
                  aria-label={t('taskItem.deleteTask')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Metadata Row */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Priority Badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${priority.bgColor} ${priority.color} ${priority.borderColor}`}>
                <Flag className="w-3 h-3" />
                {priorityLabel}
              </span>

              {/* Due Date */}
              {dueDateInfo && !task.completed && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  dueDateInfo.isOverdue
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : dueDateInfo.isUrgent
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {dueDateInfo.isOverdue ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {dueDateInfo.text}
                </span>
              )}

              {/* Completed Badge */}
              {task.completed && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Check className="w-3 h-3" />
                  {t('taskItem.completed')}
                </span>
              )}

              {/* Created Date */}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {formatRelativeDate(task.created_at, language)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator for pending operations */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl backdrop-blur-sm">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
