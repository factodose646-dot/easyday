import React, { useEffect } from 'react';
import { HandCoins, NotebookPen, Plus, ReceiptText, X } from 'lucide-react';
import { TranslationBundle } from '../i18n/translations';
import { QuickAddKind } from '../screens/ToolDetailScreen';

interface QuickAddFabProps {
  open: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onQuickAdd: (kind: QuickAddKind) => void;
  t: TranslationBundle;
}

export const QuickAddFab: React.FC<QuickAddFabProps> = ({
  open,
  onToggleOpen,
  onClose,
  onQuickAdd,
  t,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const actions: {
    kind: QuickAddKind;
    label: string;
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    iconClass: string;
  }[] = [
    {
      kind: 'expense',
      label: t.dashboard.fab.expenseShort,
      Icon: ReceiptText,
      iconClass: 'bg-yellow-400 text-[#040D21]',
    },
    {
      kind: 'udhaar',
      label: t.dashboard.fab.udhaarShort,
      Icon: HandCoins,
      iconClass: 'bg-cyan-500 text-[#040D21]',
    },
    {
      kind: 'note',
      label: t.dashboard.fab.noteShort,
      Icon: NotebookPen,
      iconClass: 'bg-amber-400 text-[#040D21]',
    },
  ];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t.dashboard.fab.closeLabel}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-[#040D21]/45 backdrop-blur-[1px] transition-opacity duration-150"
        />
      )}

      <div className="fixed bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] md:bottom-6 end-4 md:end-6 z-30 flex flex-col items-end gap-2.5 pointer-events-none">
        {open && (
          <div
            role="menu"
            aria-label={t.dashboard.quickAdd.heading}
            className="flex flex-col items-end gap-2 pointer-events-auto"
          >
            {actions.map(({ kind, label, Icon, iconClass }) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                data-testid={`fab-action-${kind}`}
                onClick={() => {
                  onClose();
                  onQuickAdd(kind);
                }}
                className="flex items-center gap-2.5 ps-3.5 pe-2 py-2 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-900 dark:text-white shadow-lg shadow-[#040D21]/20 hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <span className="text-xs font-bold whitespace-nowrap">{label}</span>
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          data-testid="global-quick-add-fab"
          aria-expanded={open}
          aria-label={open ? t.dashboard.fab.closeLabel : t.dashboard.fab.openLabel}
          onClick={onToggleOpen}
          className={`pointer-events-auto w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            open
              ? 'bg-slate-800 dark:bg-[#11244D] text-white border border-cyan-400/40 shadow-[#040D21]/30'
              : 'bg-yellow-400 hover:bg-yellow-300 text-[#040D21] shadow-yellow-400/25'
          }`}
        >
          {open ? (
            <X className="w-6 h-6" strokeWidth={2.4} />
          ) : (
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </>
  );
};
