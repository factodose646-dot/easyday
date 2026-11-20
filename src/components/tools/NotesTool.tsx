import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import { generateId, NoteItem, notesStorage } from '../../utils/storage';

interface NotesToolProps {
  language: Language;
  t: ToolTranslationBundle['notes'];
}

export const NotesTool: React.FC<NotesToolProps> = ({ language, t }) => {
  const [notes, setNotes] = useState<NoteItem[]>(() => notesStorage.load());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftDesc, setDraftDesc] = useState<string>('');
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const formatTimestamp = useCallback(
    (ts: number) => {
      try {
        return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(ts));
      } catch {
        return new Date(ts).toLocaleDateString();
      }
    },
    [language]
  );

  const persistNotes = useCallback((next: NoteItem[]) => {
    setNotes(next);
    notesStorage.save(next);
  }, []);

  const handleCreateNew = () => {
    const now = Date.now();
    const newId = generateId('note');
    setEditingNoteId(newId);
    setDraftTitle('');
    setDraftDesc('');
    setAutoSavedAt(null);
    // Do not persist until user enters content, or create on first keystroke via upsertDraft
    void now;
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setDraftTitle(note.title);
    setDraftDesc(note.description);
    setAutoSavedAt(note.updatedAt);
  };

  const upsertDraft = useCallback(
    (id: string, titleVal: string, descVal: string) => {
      const now = Date.now();
      const exists = notes.some((n) => n.id === id);
      const hasContent = titleVal.trim().length > 0 || descVal.trim().length > 0;

      if (!exists && !hasContent) {
        return;
      }

      if (exists) {
        const next = notes.map((n) =>
          n.id === id
            ? { ...n, title: titleVal, description: descVal, updatedAt: now }
            : n
        );
        persistNotes(next);
      } else {
        const created: NoteItem = {
          id,
          title: titleVal,
          description: descVal,
          createdAt: now,
          updatedAt: now,
        };
        persistNotes([created, ...notes]);
      }
      setAutoSavedAt(now);
    },
    [notes, persistNotes]
  );

  const handleTitleChange = (val: string) => {
    setDraftTitle(val);
    if (editingNoteId) {
      upsertDraft(editingNoteId, val, draftDesc);
    }
  };

  const handleDescChange = (val: string) => {
    setDraftDesc(val);
    if (editingNoteId) {
      upsertDraft(editingNoteId, draftTitle, val);
    }
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    const next = notes.filter((n) => n.id !== pendingDeleteId);
    persistNotes(next);
    if (editingNoteId === pendingDeleteId) {
      setEditingNoteId(null);
    }
    setPendingDeleteId(null);
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === editingNoteId) ?? null,
    [notes, editingNoteId]
  );

  // Editor View
  if (editingNoteId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEditingNoteId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t.backToList}</span>
          </button>

          <div className="flex items-center gap-2">
            {autoSavedAt && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
                <Check className="w-3.5 h-3.5" />
                <span>{t.savedStatus}</span>
              </span>
            )}
            {activeNote && (
              <button
                type="button"
                onClick={() => setPendingDeleteId(activeNote.id)}
                aria-label={t.deleteBtn}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={t.titlePlaceholder}
            aria-label={t.titlePlaceholder}
            className="w-full text-lg sm:text-xl font-bold bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none border-b border-slate-100 dark:border-slate-800 pb-3"
          />

          <textarea
            value={draftDesc}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder={t.descPlaceholder}
            aria-label={t.descPlaceholder}
            rows={8}
            className="w-full text-sm sm:text-base bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-y leading-relaxed"
          />

          {activeNote && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {t.createdLabel}: {formatTimestamp(activeNote.createdAt)}
              </span>
              <span>
                {t.modifiedLabel}: {formatTimestamp(activeNote.updatedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {pendingDeleteId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-delete-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
              <h3
                id="note-delete-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {t.confirmDeleteTitle}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t.confirmDeleteBody}
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold min-h-[44px]"
                >
                  {t.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Notes List View
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full h-12 ps-10 pe-10 rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear"
              className="absolute top-1/2 -translate-y-1/2 end-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shrink-0 min-h-[48px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newNoteBtn}</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {t.emptyTitle}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.emptySubtitle}
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.noMatch}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => handleOpenEdit(note)}
                className="text-start space-y-1.5 flex-1 focus:outline-none"
              >
                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {note.title.trim() || t.untitled}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-line">
                  {note.description.trim() || '—'}
                </p>
              </button>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 min-w-0 truncate">
                  {t.modifiedLabel}: {formatTimestamp(note.updatedAt)}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(note)}
                    aria-label={t.editBtn}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(note.id)}
                    aria-label={t.deleteBtn}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-list-delete-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
            <h3
              id="note-list-delete-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {t.confirmDeleteTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t.confirmDeleteBody}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold min-h-[44px]"
              >
                {t.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
