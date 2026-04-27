import { useEffect, useRef, useState } from 'react';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const YEAR_PAGE_SIZE = 16;

interface Props {
  anchor: Date;
  onPick: (year: number, monthIdx: number) => void;
  onJumpToday: () => void;
}

export function MonthPicker({ anchor, onPick, onJumpToday }: Props) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => anchor.getFullYear());
  const [yearPageStart, setYearPageStart] = useState(
    () => Math.floor(anchor.getFullYear() / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE,
  );
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function openPicker() {
    setPickerYear(anchor.getFullYear());
    setYearPageStart(Math.floor(anchor.getFullYear() / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE);
    setOpen(true);
  }

  const monthLabel = anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const yearsOnPage = Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i);
  const currentYear = new Date().getFullYear();

  return (
    <div className="cal-month-wrap" ref={ref}>
      <button
        className="cal-month-toggle"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Pick month and year"
      >
        {monthLabel}
        <span className="cal-month-caret">▾</span>
      </button>

      {open && (
        <div className="cal-picker" role="dialog" aria-label="Pick month and year">
          <div className="cal-picker-section">
            <div className="cal-picker-head">
              <button
                className="icon-btn small"
                onClick={() => setYearPageStart(yearPageStart - YEAR_PAGE_SIZE)}
                aria-label="Earlier years"
              >‹</button>
              <span className="cal-picker-range">
                {yearPageStart}–{yearPageStart + YEAR_PAGE_SIZE - 1}
              </span>
              <button
                className="icon-btn small"
                onClick={() => setYearPageStart(yearPageStart + YEAR_PAGE_SIZE)}
                aria-label="Later years"
              >›</button>
            </div>
            <div className="cal-year-grid">
              {yearsOnPage.map(y => (
                <button
                  key={y}
                  className={`cal-year-tile${y === pickerYear ? ' selected' : ''}${y === currentYear ? ' today' : ''}`}
                  onClick={() => setPickerYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="cal-picker-section">
            <div className="cal-picker-head">
              <span className="cal-picker-range">{pickerYear}</span>
              <button
                className="btn-ghost small"
                onClick={() => {
                  onJumpToday();
                  setOpen(false);
                }}
              >Jump to today</button>
            </div>
            <div className="cal-month-grid">
              {MONTH_LABELS.map((m, i) => {
                const isCurrent =
                  i === anchor.getMonth() && pickerYear === anchor.getFullYear();
                return (
                  <button
                    key={m}
                    className={`cal-month-tile${isCurrent ? ' selected' : ''}`}
                    onClick={() => {
                      onPick(pickerYear, i);
                      setOpen(false);
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
