import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { TOOL_TRANSLATIONS } from '../i18n/toolTranslations';
import { TranslationBundle } from '../i18n/translations';
import { Language, ToolId } from '../types';
import { ToolIcon } from '../components/ToolIcon';
import { AgeCalculatorTool } from '../components/tools/AgeCalculatorTool';
import { CalculatorTool } from '../components/tools/CalculatorTool';
import { ExpenseTrackerTool } from '../components/tools/ExpenseTrackerTool';
import { NotesTool } from '../components/tools/NotesTool';
import { TodoListTool } from '../components/tools/TodoListTool';
import { UnitConverterTool } from '../components/tools/UnitConverterTool';

interface ToolDetailScreenProps {
  toolId: ToolId;
  language: Language;
  onBack: () => void;
  t: TranslationBundle;
}

export const ToolDetailScreen: React.FC<ToolDetailScreenProps> = ({
  toolId,
  language,
  onBack,
  t,
}) => {
  const copy = t.tools[toolId];
  const toolT = TOOL_TRANSLATIONS[language];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Compact Header with Back Button & Tool Identity */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label={t.toolDetail.backToTools}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px] shrink-0"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t.toolDetail.backToTools}</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <ToolIcon toolId={toolId} size="sm" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {copy.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {copy.shortDesc}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Active Tool Workspace */}
      <div>
        {toolId === 'calculator' && <CalculatorTool t={toolT.calculator} />}
        {toolId === 'age-calculator' && (
          <AgeCalculatorTool language={language} t={toolT.age} />
        )}
        {toolId === 'notes' && <NotesTool language={language} t={toolT.notes} />}
        {toolId === 'todo-list' && (
          <TodoListTool language={language} t={toolT.todo} />
        )}
        {toolId === 'expense-tracker' && (
          <ExpenseTrackerTool language={language} t={toolT.expense} />
        )}
        {toolId === 'unit-converter' && (
          <UnitConverterTool t={toolT.converter} />
        )}
      </div>
    </div>
  );
};
