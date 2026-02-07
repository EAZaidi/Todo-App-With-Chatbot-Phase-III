'use client';

import { useState, useMemo } from 'react';
import type { Task, Priority } from '@/lib/api/types';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';
import { useLanguage } from './LanguageProvider';
import { ListFilter, ArrowUpDown, CheckCircle2, Circle, Flag, Calendar, Clock } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  pendingOperations: Set<number>;
}

type FilterType = 'all' | 'active' | 'completed';
type SortType = 'created' | 'priority' | 'dueDate' | 'title';

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete, pendingOperations }: TaskListProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('created');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter
    if (filter === 'active') {
      result = result.filter(t => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter(t => t.completed);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dueDate':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [tasks, filter, sortBy]);

  if (tasks.length === 0) {
    return <EmptyState title={t('emptyState.noTasks')} description={t('emptyState.createFirst')} />;
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.length - completedCount;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return (
    <div>
      {/* Header with Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('taskList.yourTasks')}</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Circle className="w-3 h-3" />
                {activeCount} {t('taskList.active')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {completedCount} {t('taskList.done')}
              </span>
              {highPriorityCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                  <Flag className="w-3 h-3" />
                  {highPriorityCount} {t('taskList.urgent')}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-600 min-w-[40px]">
              {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </span>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                showFilters
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter by Status */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {t('taskList.filterByStatus')}
                </label>
                <div className="flex gap-2">
                  {([
                    { value: 'all' as FilterType, label: t('taskList.all') },
                    { value: 'active' as FilterType, label: t('taskList.activeFilter') },
                    { value: 'completed' as FilterType, label: t('taskList.completedFilter') },
                  ]).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filter === value
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort by */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {t('taskList.sortBy')}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'created', label: t('taskList.recent'), icon: Clock },
                    { value: 'priority', label: t('taskList.priority'), icon: Flag },
                    { value: 'dueDate', label: t('taskList.dueDateSort'), icon: Calendar },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value as SortType)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        sortBy === value
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <ListFilter className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">{t('taskList.noMatch')}</h3>
          <p className="text-sm text-slate-500">{t('taskList.adjustFilter')}</p>
          <button
            onClick={() => setFilter('all')}
            className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-200 transition-colors"
          >
            {t('taskList.showAll')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 0.05}s`, animationDuration: '0.3s' }}
            >
              <TaskItem
                task={task}
                onToggleComplete={() => onToggleComplete(task.id, task.completed)}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task.id)}
                isPending={pendingOperations.has(task.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
