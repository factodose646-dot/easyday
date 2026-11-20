import React, { useCallback, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import { generateId, TodoItem, todosStorage } from '../../utils/storage';

interface TodoListToolProps {
  language: Language;
  t: ToolTranslationBundle['todo'];
}

export const TodoListTool: React.FC<TodoListToolProps> = ({ language, t }) => {
  const [todos, setTodos] = useState<TodoItem[]>(() => todosStorage.load());
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const persistTodos = useCallback((next: TodoItem[]) => {
    setTodos(next);
    todosStorage.save(next);
  }, []);

  const formatDate = useCallback(
    (ts: number) => {
      try {
        return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(ts));
      } catch {
        return new Date(ts).toLocaleDateString();
      }
    },
    [language]
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) {
      setInputError(t.emptyInputError);
      return;
    }
    const item: TodoItem = {
      id: generateId('todo'),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    persistTodos([item, ...todos]);
    setNewTaskText('');
    setInputError(null);
  };

  const handleToggleComplete = (id: string) => {
    const next = todos.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    persistTodos(next);
  };

  const handleStartEdit = (item: TodoItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const next = todos.map((item) =>
      item.id === editingId ? { ...item, text: trimmed } : item
    );
    persistTodos(next);
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteTask = (id: string) => {
    persistTodos(todos.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleConfirmClearCompleted = () => {
    persistTodos(todos.filter((item) => !item.completed));
    setConfirmClearOpen(false);
  };

  const pendingTasks = useMemo(
    () => todos.filter((item) => !item.completed),
    [todos]
  );
  const completedTasks = useMemo(
    () => todos.filter((item) => item.completed),
    [todos]
  );

  const progressPercent = useMemo(() => {
    if (todos.length === 0) return 0;
    return Math.round((completedTasks.length / todos.length) * 100);
  }, [completedTasks.length, todos.length]);

  const renderTaskRow = (item: TodoItem) => {
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        className="rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 flex items-start gap-3"
      >
        <button
          type="button"
          onClick={() => handleToggleComplete(item.id)}
          aria-label={item.completed ? 'Mark as pending' : 'Mark as completed'}
          aria-pressed={item.completed}
          className={`w-7 h-7 mt-1 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
            item.completed
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-600'
          }`}
        >
          {item.completed && <Check className="w-4 h-4" strokeWidth={2.8} />}
        </button>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-blue-500 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold min-h-[40px]"
                >
                  {t.saveBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold min-h-[40px]"
                >
                  {t.cancelBtn}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                className={`text-sm sm:text-base font-medium break-words ${
                  item.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {item.text}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {t.createdLabel}: {formatDate(item.createdAt)}
              </p>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleStartEdit(item)}
              aria-label={t.editBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteTask(item.id)}
              aria-label={t.deleteBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Daily Progress Card */}
      <section className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t.progressLabel}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
              {completedTasks.length} / {todos.length} {t.tasksCompletedOf}
            </p>
          </div>
          <span className="text-xl font-extrabold text-blue-600 dark:text-sky-400 tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0B6FF2] to-[#0D9488] transition-[width] duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => {
              setNewTaskText(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={t.inputPlaceholder}
            aria-label={t.inputPlaceholder}
            className="flex-1 h-12 px-4 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold min-h-[48px] shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addBtn}</span>
          </button>
        </div>
        {inputError && (
          <p
            role="alert"
            className="text-xs font-medium text-red-600 dark:text-red-400 px-1"
          >
            {inputError}
          </p>
        )}
      </form>

      {/* Pending Tasks Section */}
      <section className="space-y-2.5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">
          {t.pendingTitle} ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#131C31] border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.noPending}
          </div>
        ) : (
          <div className="space-y-2.5">{pendingTasks.map(renderTaskRow)}</div>
        )}
      </section>

      {/* Completed Tasks Section */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.completedTitle} ({completedTasks.length})
          </h2>
          {completedTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline min-h-[36px] px-2"
            >
              {t.clearCompletedBtn}
            </button>
          )}
        </div>
        {completedTasks.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#131C31] border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.noCompleted}
          </div>
        ) : (
          <div className="space-y-2.5">{completedTasks.map(renderTaskRow)}</div>
        )}
      </section>

      {/* Clear Completed Confirmation Modal */}
      {confirmClearOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-completed-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <h3
                id="clear-completed-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {t.confirmClearTitle}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                aria-label={t.cancelBtn}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t.confirmClearBody}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCompleted}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold min-h-[44px]"
              >
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
