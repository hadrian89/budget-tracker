import React from 'react';
import './MonthPicker.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MonthPicker({ month, onChange, showFilter = false }) {
  const prev = () => {
    const d = new Date(month);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    onChange(d);
  };

  const next = () => {
    const d = new Date(month);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    onChange(d);
  };

  return (
    <div className="month-picker">
      <span className="mp-cal-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>
      <button className="mp-arrow" onClick={prev} aria-label="Previous month">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span className="mp-label">{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
      <button className="mp-arrow" onClick={next} aria-label="Next month">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      {showFilter && (
        <button className="mp-filter" aria-label="Filter">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
      )}
    </div>
  );
}
