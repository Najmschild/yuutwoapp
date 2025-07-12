import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Calendar Component
const Calendar = ({ year, month, onDateClick, calendarData }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDayData = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData?.find(data => data.date === dateStr);
  };

  const getDayClass = (day) => {
    const dayData = getDayData(day);
    if (!dayData) return 'calendar-day';

    let classes = 'calendar-day';
    
    if (dayData.is_period) {
      classes += ' period-day';
      if (dayData.flow_intensity === 'light') classes += ' flow-light';
      else if (dayData.flow_intensity === 'heavy') classes += ' flow-heavy';
      else classes += ' flow-medium';
    } else if (dayData.is_predicted_period) {
      classes += ' predicted-period';
    } else if (dayData.is_ovulation) {
      classes += ' ovulation-day';
    } else if (dayData.is_fertile) {
      classes += ' fertile-day';
    } else if (dayData.phase === 'luteal') {
      classes += ' luteal-phase';
    }

    return classes;
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = getDayData(day);
      days.push(
        <div
          key={day}
          className={getDayClass(day)}
          onClick={() => onDateClick(year, month, day)}
        >
          <span className="day-number">{day}</span>
          {dayData?.is_period && <span className="period-indicator">●</span>}
          {dayData?.is_ovulation && <span className="ovulation-indicator">○</span>}
          {dayData?.is_fertile && !dayData.is_ovulation && <span className="fertile-indicator">◇</span>}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>{monthNames[month - 1]} {year}</h2>
      </div>
      <div className="calendar-grid">
        <div className="weekday-headers">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
};

// Period Log Modal
const PeriodModal = ({ isOpen, onClose, selectedDate, onSave }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedDate) {
      const dateStr = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
      setStartDate(dateStr);
    }
  }, [selectedDate]);

  const handleSave = () => {
    const periodData = {
      start_date: startDate,
      end_date: endDate || null,
      flow_intensity: flowIntensity,
      notes: notes || null
    };
    onSave(periodData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Log Period</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Flow Intensity</label>
            <select
              value={flowIntensity}
              onChange={(e) => setFlowIntensity(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any symptoms?"
              rows="3"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Period</button>
        </div>
      </div>
    </div>
  );
};

// Cycle Insights Component
const CycleInsights = ({ predictions }) => {
  if (!predictions) return null;

  return (
    <div className="cycle-insights">
      <h3>Cycle Insights</h3>
      <div className="insights-grid">
        {predictions.average_cycle_length && (
          <div className="insight-card">
            <div className="insight-label">Average Cycle</div>
            <div className="insight-value">{predictions.average_cycle_length} days</div>
          </div>
        )}
        <div className="insight-card">
          <div className="insight-label">Regularity</div>
          <div className="insight-value">{predictions.cycle_regularity}</div>
        </div>
        {predictions.next_period_start && (
          <div className="insight-card">
            <div className="insight-label">Next Period</div>
            <div className="insight-value">
              {new Date(predictions.next_period_start).toLocaleDateString()}
            </div>
          </div>
        )}
        {predictions.next_ovulation && (
          <div className="insight-card">
            <div className="insight-label">Next Ovulation</div>
            <div className="insight-value">
              {new Date(predictions.next_ovulation).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Legend Component
const Legend = () => {
  return (
    <div className="legend">
      <h4>Calendar Legend</h4>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-color period-day flow-medium"></span>
          <span>Period Day</span>
        </div>
        <div className="legend-item">
          <span className="legend-color predicted-period"></span>
          <span>Predicted Period</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ovulation-day"></span>
          <span>Ovulation</span>
        </div>
        <div className="legend-item">
          <span className="legend-color fertile-day"></span>
          <span>Fertile Window</span>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Load calendar data
  const loadCalendarData = async (year, month) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/calendar/${year}/${month}`);
      setCalendarData(response.data.calendar_data);
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Handle date click
  const handleDateClick = (year, month, day) => {
    setSelectedDate({ year, month, day });
    setIsModalOpen(true);
  };

  // Save period
  const handleSavePeriod = async (periodData) => {
    try {
      await axios.post(`${API}/periods`, periodData);
      // Reload calendar data
      loadCalendarData(currentYear, currentMonth);
    } catch (error) {
      console.error('Error saving period:', error);
    }
  };

  // Load data on mount and when month changes
  useEffect(() => {
    loadCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cycle Tracker</h1>
        <p>Track your menstrual health with clarity and empowerment</p>
      </header>

      <main className="app-main">
        <div className="calendar-section">
          <div className="calendar-navigation">
            <button onClick={() => navigateMonth(-1)} className="nav-button">
              ‹ Previous
            </button>
            <button onClick={() => navigateMonth(1)} className="nav-button">
              Next ›
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading calendar...</div>
          ) : (
            <Calendar
              year={currentYear}
              month={currentMonth}
              onDateClick={handleDateClick}
              calendarData={calendarData}
            />
          )}
        </div>

        <div className="sidebar">
          <CycleInsights predictions={predictions} />
          <Legend />
        </div>
      </main>

      <PeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onSave={handleSavePeriod}
      />
    </div>
  );
}

export default App;