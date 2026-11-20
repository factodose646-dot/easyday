import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Delete, History, Trash2 } from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import {
  CalcHistoryItem,
  evaluateExpression,
} from '../../utils/calculatorEngine';
import { calcHistoryStorage, generateId } from '../../utils/storage';

interface CalculatorToolProps {
  t: ToolTranslationBundle['calculator'];
}

const OPERATORS = new Set(['+', '-', '×', '÷']);

export const CalculatorTool: React.FC<CalculatorToolProps> = ({ t }) => {
  const [expression, setExpression] = useState<string>('0');
  const [lastResult, setLastResult] = useState<string>('');
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<CalcHistoryItem[]>(() =>
    calcHistoryStorage.load()
  );

  // Live preview result when typing valid multi-term expressions
  const livePreview = useMemo(() => {
    if (justEvaluated || !expression || expression === '0') return '';
    const lastChar = expression[expression.length - 1];
    if (OPERATORS.has(lastChar) || lastChar === '.') return '';
    const hasOp = /[+\-×÷%]/.test(expression.slice(1));
    if (!hasOp) return '';
    const res = evaluateExpression(expression);
    return res.ok && res.formatted ? res.formatted : '';
  }, [expression, justEvaluated]);

  const appendDigit = useCallback(
    (digit: string) => {
      setErrorMsg(null);
      setExpression((prev) => {
        if (justEvaluated) {
          setJustEvaluated(false);
          setLastResult('');
          return digit === '00' ? '0' : digit;
        }
        if (prev === '0') {
          return digit === '00' ? '0' : digit;
        }
        // Prevent leading zeros like 5+007
        const parts = prev.split(/[+\-×÷]/);
        const currentToken = parts[parts.length - 1];
        if (currentToken === '0') {
          return prev.slice(0, -1) + (digit === '00' ? '0' : digit);
        }
        if (currentToken.endsWith('%')) {
          return prev + '×' + (digit === '00' ? '0' : digit);
        }
        return prev + digit;
      });
    },
    [justEvaluated]
  );

  const appendDecimal = useCallback(() => {
    setErrorMsg(null);
    setExpression((prev) => {
      if (justEvaluated) {
        setJustEvaluated(false);
        setLastResult('');
        return '0.';
      }
      const parts = prev.split(/[+\-×÷]/);
      const currentToken = parts[parts.length - 1];
      if (currentToken.includes('.')) return prev;
      if (currentToken === '') return prev + '0.';
      if (currentToken.endsWith('%')) return prev + '×0.';
      return prev + '.';
    });
  }, [justEvaluated]);

  const appendOperator = useCallback(
    (op: '+' | '-' | '×' | '÷') => {
      setErrorMsg(null);
      setJustEvaluated(false);
      setExpression((prev) => {
        if (!prev || prev === '-') return op === '-' ? '-' : '0' + op;
        const lastChar = prev[prev.length - 1];
        if (OPERATORS.has(lastChar)) {
          return prev.slice(0, -1) + op;
        }
        if (lastChar === '.') {
          return prev + '0' + op;
        }
        return prev + op;
      });
    },
    []
  );

  const appendPercent = useCallback(() => {
    setErrorMsg(null);
    setJustEvaluated(false);
    setExpression((prev) => {
      const lastChar = prev[prev.length - 1];
      if (OPERATORS.has(lastChar) || lastChar === '%' || lastChar === '.') {
        return prev;
      }
      return prev + '%';
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setExpression('0');
    setLastResult('');
    setJustEvaluated(false);
    setErrorMsg(null);
  }, []);

  const handleBackspace = useCallback(() => {
    setErrorMsg(null);
    if (justEvaluated) {
      setJustEvaluated(false);
    }
    setExpression((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, [justEvaluated]);

  const handleEquals = useCallback(() => {
    const trimmed = expression.trim();
    if (!trimmed) return;
    const res = evaluateExpression(trimmed);
    if (!res.ok || !res.formatted) {
      const key = res.errorKey ?? 'invalidExpression';
      setErrorMsg(t.errors[key]);
      return;
    }

    setErrorMsg(null);
    setLastResult(trimmed);
    setExpression(res.formatted);
    setJustEvaluated(true);

    const entry: CalcHistoryItem = {
      id: generateId('calc'),
      expression: trimmed,
      result: res.formatted,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 25);
      calcHistoryStorage.save(next);
      return next;
    });
  }, [expression, t.errors]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    calcHistoryStorage.save([]);
  }, []);

  const handleReuseHistory = useCallback((item: CalcHistoryItem) => {
    setExpression(item.result);
    setLastResult(item.expression);
    setJustEvaluated(true);
    setErrorMsg(null);
    setShowHistory(false);
  }, []);

  // Keyboard support for desktop/hardware keyboards
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        appendDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        appendDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        appendOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        appendOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        appendOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        appendOperator('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        appendPercent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearAll();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    appendDecimal,
    appendDigit,
    appendOperator,
    appendPercent,
    handleBackspace,
    handleClearAll,
    handleEquals,
  ]);

  return (
    <div className="space-y-4">
      {/* Mode Switch Header: Keypad vs History */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t.historyTitle} ({history.length})
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px] transition-colors"
        >
          <History className="w-4 h-4" />
          <span>{showHistory ? t.hideHistory : t.showHistory}</span>
        </button>
      </div>

      {/* Display Screen (kept LTR for mathematical clarity even in Urdu RTL) */}
      <div
        dir="ltr"
        className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-right space-y-2"
      >
        <div className="min-h-[20px] text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
          {lastResult ? `${lastResult} =` : '\u00A0'}
        </div>

        <div
          aria-live="polite"
          className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white font-mono tabular-nums break-all leading-tight min-h-[44px]"
        >
          {expression}
        </div>

        <div className="min-h-[24px] flex items-center justify-end">
          {errorMsg ? (
            <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
              {errorMsg}
            </p>
          ) : livePreview ? (
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 font-mono tabular-nums">
              = {livePreview}
            </p>
          ) : (
            <span className="text-xs text-transparent select-none">0</span>
          )}
        </div>
      </div>

      {/* Conditional View: History Panel or Keypad */}
      {showHistory ? (
        <section className="rounded-3xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.historyTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.tapToReuse}
              </p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[40px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearHistory}</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noHistory}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[340px] overflow-y-auto">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleReuseHistory(item)}
                  dir="ltr"
                  className="w-full py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-right transition-colors min-h-[52px]"
                >
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono truncate">
                    {item.expression}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-sky-400 font-mono tabular-nums shrink-0">
                    = {item.result}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div
          dir="ltr"
          className="grid grid-cols-4 gap-2.5 sm:gap-3"
          role="group"
          aria-label="Calculator Keypad"
        >
          {/* Row 1 */}
          <button
            type="button"
            onClick={handleClearAll}
            className="min-h-[56px] rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-base hover:bg-red-100 dark:hover:bg-red-950/70 active:scale-[0.98] transition-all"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Delete last digit"
            className="min-h-[56px] rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={appendPercent}
            className="min-h-[56px] rounded-2xl bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => appendOperator('÷')}
            className="min-h-[56px] rounded-2xl bg-blue-600/12 dark:bg-sky-500/20 text-blue-700 dark:text-sky-300 font-bold text-xl hover:bg-blue-600/20 active:scale-[0.98] transition-all"
          >
            ÷
          </button>

          {/* Row 2 */}
          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => appendDigit(d)}
              className="min-h-[56px] rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xl font-mono hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => appendOperator('×')}
            className="min-h-[56px] rounded-2xl bg-blue-600/12 dark:bg-sky-500/20 text-blue-700 dark:text-sky-300 font-bold text-xl hover:bg-blue-600/20 active:scale-[0.98] transition-all"
          >
            ×
          </button>

          {/* Row 3 */}
          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => appendDigit(d)}
              className="min-h-[56px] rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xl font-mono hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => appendOperator('-')}
            className="min-h-[56px] rounded-2xl bg-blue-600/12 dark:bg-sky-500/20 text-blue-700 dark:text-sky-300 font-bold text-xl hover:bg-blue-600/20 active:scale-[0.98] transition-all"
          >
            −
          </button>

          {/* Row 4 */}
          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => appendDigit(d)}
              className="min-h-[56px] rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xl font-mono hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => appendOperator('+')}
            className="min-h-[56px] rounded-2xl bg-blue-600/12 dark:bg-sky-500/20 text-blue-700 dark:text-sky-300 font-bold text-xl hover:bg-blue-600/20 active:scale-[0.98] transition-all"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            type="button"
            onClick={() => appendDigit('00')}
            className="min-h-[56px] rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-lg font-mono hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            00
          </button>
          <button
            type="button"
            onClick={() => appendDigit('0')}
            className="min-h-[56px] rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xl font-mono hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={appendDecimal}
            className="min-h-[56px] rounded-2xl bg-white dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-2xl font-mono hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className="min-h-[56px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xl shadow-sm active:scale-[0.98] transition-all"
          >
            =
          </button>
        </div>
      )}
    </div>
  );
};
