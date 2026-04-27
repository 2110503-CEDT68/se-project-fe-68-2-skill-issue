'use client';

import { DateReserveProps } from '../../../interface';
import { timeOptions } from '../../utils/timeOptions';
import '@/styles/dateReserve.css';

export default function DateReserve({ date, time, onDateChange, onTimeChange }: DateReserveProps) {
  return (
    <div className="modal-date-row">
      <div className="modal-field">
        <label>Interview Date <span className="req">*</span></label>
        <input
          type="date"
          className="modal-input"
          min="2022-05-10"
          max="2022-05-14"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label>Time <span className="req">*</span></label>
        <select
          className="modal-input"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
        >
          {timeOptions().map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}