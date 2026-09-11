import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MonthPicker = ({ selectedDate, onDateChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const currentDate = new Date(selectedDate);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const handleMonthChange = (month) => {
    const newDate = new Date(currentYear, month, 1);
    onDateChange(newDate.toISOString().split('T')[0]);
    setShowPicker(false);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(year, currentMonth, 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    onDateChange(newDate.toISOString().split('T')[0]);
  };

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        {months[currentMonth]} {currentYear}
      </button>

      {showPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-slate-700">
              {months[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {months.map((month, idx) => (
              <button
                key={month}
                onClick={() => handleMonthChange(idx)}
                className={`py-2 px-1 text-sm rounded transition-colors ${
                  idx === currentMonth
                    ? "bg-teal-500 text-white font-medium"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {month.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                className={`flex-1 py-2 text-sm rounded transition-colors ${
                  year === currentYear
                    ? "bg-teal-500 text-white font-medium"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
