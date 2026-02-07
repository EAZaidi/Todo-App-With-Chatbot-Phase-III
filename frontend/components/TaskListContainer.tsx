'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskCreateRequest, TaskUpdateRequest } from '@/lib/api/types';
import { getTasks, createTask, toggleTaskComplete, updateTask, deleteTask } from '@/lib/api/tasks';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { LoadingSpinner } from './LoadingSpinner';
import { EditTaskModal } from './EditTaskModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useAuth } from './auth/AuthProvider';
import { useLanguage } from './LanguageProvider';

export function TaskListContainer() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Set<number>>(new Set());
  const [togglingTasks, setTogglingTasks] = useState<Set<number>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch tasks when user is authenticated
    if (user && !authLoading) {
      fetchTasks();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [fetchTasks, user, authLoading]);

  const handleCreateTask = async (data: TaskCreateRequest) => {
    try {
      setIsCreating(true);
      setCreateError(null);
      const newTask = await createTask(data);
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (taskId: number, currentCompleted: boolean) => {
    // T031: Prevent multiple simultaneous toggles on same task
    if (togglingTasks.has(taskId)) {
      return;
    }

    const newCompleted = !currentCompleted;

    // T029: Optimistic UI update - immediately show the change
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: newCompleted } : task
      )
    );

    // Track toggling separately (no spinner overlay)
    setTogglingTasks((prev) => new Set(prev).add(taskId));

    try {
      // T028: Call toggleTaskComplete() API with PATCH request
      const updatedTask = await toggleTaskComplete(taskId, newCompleted);
      // Update with server response (in case of any server-side changes)
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (err) {
      // T030: Rollback logic - restore previous completion state on failure
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: currentCompleted } : task
        )
      );
      console.error('Failed to toggle task:', err);
    } finally {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditError(null);
  };

  // T037-T038: Handle edit save with PUT request and state update
  const handleEditSave = async (data: TaskUpdateRequest) => {
    if (!editingTask) return;

    try {
      setIsEditing(true);
      setEditError(null);
      const updatedTask = await updateTask(editingTask.id, data);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask.id ? updatedTask : task
        )
      );
      setEditingTask(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsEditing(false);
    }
  };

  // T039: Cancel edit and close modal
  const handleEditClose = () => {
    setEditingTask(null);
    setEditError(null);
  };

  const handleDelete = (taskId: number) => {
    setDeletingTaskId(taskId);
    setDeleteError(null);
  };

  // T044-T045: Handle delete confirm with DELETE request and state update
  const handleDeleteConfirm = async () => {
    if (!deletingTaskId) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteTask(deletingTaskId);
      // T045: Remove deleted task from list
      setTasks((prev) => prev.filter((task) => task.id !== deletingTaskId));
      setDeletingTaskId(null);
    } catch (err) {
      // T047: Error handling for failed deletions
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  // T046: Cancel delete and close dialog
  const handleDeleteCancel = () => {
    setDeletingTaskId(null);
    setDeleteError(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" label={t('taskListContainer.loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-3xl flex items-center justify-center">
          <svg className="w-10 h-10 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('taskListContainer.welcome')}</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t('taskListContainer.welcomeSubtitle')}</p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
          >
            {t('taskListContainer.signIn')}
          </a>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            {t('taskListContainer.createAccount')}
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
        <p className="font-medium">{t('taskListContainer.errorLoading')}</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchTasks}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline"
        >
          {t('taskListContainer.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <TaskForm
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
        error={createError}
      />
      <TaskList
        tasks={tasks}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pendingOperations={pendingOperations}
      />
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onSave={handleEditSave}
          onClose={handleEditClose}
          isSaving={isEditing}
          error={editError}
        />
      )}
      {deletingTaskId && (
        <DeleteConfirmDialog
          task={tasks.find((t) => t.id === deletingTaskId)!}
          isOpen={true}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}
    </div>
  );
}
