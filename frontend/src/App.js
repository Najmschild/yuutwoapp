import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme definitions
const themes = {
  default: {
    name: 'Classic',
    description: 'Elegant purples and blues'
  },
  earth: {
    name: 'Earth Tones',
    description: 'Warm sage, brown, and beige'
  },
  monochrome: {
    name: 'Monochrome',
    description: 'Elegant blacks and whites'
  },
  calm: {
    name: 'Calm Neutrals',
    description: 'Soft blues and creams'
  },
  dark: {
    name: 'Dark Mode',
    description: 'Easy on the eyes'
  }
};

// Theme Selector Component
const ThemeSelector = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('theme-backdrop')) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="theme-selector">
        <button 
          className="theme-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          🎨 {themes[currentTheme].name}
        </button>
      </div>
      {isOpen && (
        <div className="theme-backdrop" onClick={handleBackdropClick}>
          <div className="theme-dropdown">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange(key);
                  setIsOpen(false);
                }}
              >
                <span className="theme-name">{theme.name}</span>
                <span className="theme-description">{theme.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Quick Add Period Component
const QuickAddPeriod = ({ onQuickAdd }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="quick-add-period">
      <h4>Quick Add</h4>
      <div className="quick-add-buttons">
        <button 
          className="quick-add-btn flow-light"
          onClick={() => onQuickAdd('light')}
        >
          <span className="flow-icon">◦</span>
          Light Flow
        </button>
        <button 
          className="quick-add-btn flow-medium"
          onClick={() => onQuickAdd('medium')}
        >
          <span className="flow-icon">●</span>
          Medium Flow
        </button>
        <button 
          className="quick-add-btn flow-heavy"
          onClick={() => onQuickAdd('heavy')}
        >
          <span className="flow-icon">⬤</span>
          Heavy Flow
        </button>
      </div>
      <p className="quick-add-note">Adds period starting today</p>
    </div>
  );
};

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

  const getFlowIcon = (intensity) => {
    switch(intensity) {
      case 'light': return '◦';
      case 'medium': return '●';
      case 'heavy': return '⬤';
      default: return '●';
    }
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
          {dayData?.is_period && (
            <span className="period-indicator">
              {getFlowIcon(dayData.flow_intensity)}
            </span>
          )}
          {dayData?.is_ovulation && <span className="ovulation-indicator">○</span>}
          {dayData?.is_fertile && !dayData.is_ovulation && <span className="fertile-indicator">◇</span>}
          {dayData?.notes && <span className="has-notes">📝</span>}
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

// Enhanced Period Log Modal
const PeriodModal = ({ isOpen, onClose, selectedDate, onSave, existingPeriod }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('medium');
  const [notes, setNotes] = useState('');
  const [predictedEndDate, setPredictedEndDate] = useState('');

  useEffect(() => {
    if (selectedDate) {
      const dateStr = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
      setStartDate(dateStr);
      
      // Predict end date (average 5 days)
      const startDateObj = new Date(dateStr);
      const predictedEnd = new Date(startDateObj);
      predictedEnd.setDate(predictedEnd.getDate() + 4);
      setPredictedEndDate(predictedEnd.toISOString().split('T')[0]);
    }
    
    if (existingPeriod) {
      setStartDate(existingPeriod.start_date);
      setEndDate(existingPeriod.end_date || '');
      setFlowIntensity(existingPeriod.flow_intensity);
      setNotes(existingPeriod.notes || '');
    }
  }, [selectedDate, existingPeriod]);

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

  const handleUsePrediction = () => {
    setEndDate(predictedEndDate);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{existingPeriod ? 'Edit Period' : 'Log Period'}</h3>
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
            <label>End Date</label>
            <div className="date-input-with-prediction">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Optional"
              />
              {!endDate && predictedEndDate && (
                <button 
                  type="button"
                  className="prediction-button"
                  onClick={handleUsePrediction}
                >
                  Use predicted: {new Date(predictedEndDate).toLocaleDateString()}
                </button>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Flow Intensity</label>
            <div className="flow-selector">
              {['light', 'medium', 'heavy'].map(intensity => (
                <button
                  key={intensity}
                  type="button"
                  className={`flow-option ${flowIntensity === intensity ? 'active' : ''} flow-${intensity}`}
                  onClick={() => setFlowIntensity(intensity)}
                >
                  <span className="flow-icon">
                    {intensity === 'light' ? '◦' : intensity === 'medium' ? '●' : '⬤'}
                  </span>
                  <span className="flow-label">{intensity.charAt(0).toUpperCase() + intensity.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any symptoms, mood changes, or observations?"
              rows="3"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            {existingPeriod ? 'Update Period' : 'Save Period'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Cycle Insights Component
const CycleInsights = ({ predictions }) => {
  if (!predictions) return null;

  const getRegularityColor = (regularity) => {
    switch(regularity) {
      case 'Regular': return 'success';
      case 'Somewhat Regular': return 'warning';
      case 'Irregular': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <div className="cycle-insights">
      <h3>Cycle Insights</h3>
      <div className="insights-grid">
        {predictions.average_cycle_length && (
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <div className="insight-label">Average Cycle</div>
              <div className="insight-value">{predictions.average_cycle_length} days</div>
            </div>
          </div>
        )}
        <div className="insight-card">
          <div className="insight-icon">🎯</div>
          <div className="insight-content">
            <div className="insight-label">Regularity</div>
            <div className={`insight-value ${getRegularityColor(predictions.cycle_regularity)}`}>
              {predictions.cycle_regularity}
            </div>
          </div>
        </div>
        {predictions.next_period_start && (
          <div className="insight-card">
            <div className="insight-icon">📅</div>
            <div className="insight-content">
              <div className="insight-label">Next Period</div>
              <div className="insight-value">
                {new Date(predictions.next_period_start).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
        {predictions.next_ovulation && (
          <div className="insight-card">
            <div className="insight-icon">🥚</div>
            <div className="insight-content">
              <div className="insight-label">Next Ovulation</div>
              <div className="insight-value">
                {new Date(predictions.next_ovulation).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Legend Component
const Legend = () => {
  return (
    <div className="legend">
      <h4>Calendar Legend</h4>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-color period-day flow-light"></span>
          <span className="legend-text">
            <strong>Light Flow</strong> ◦
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-color period-day flow-medium"></span>
          <span className="legend-text">
            <strong>Medium Flow</strong> ●
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-color period-day flow-heavy"></span>
          <span className="legend-text">
            <strong>Heavy Flow</strong> ⬤
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-color predicted-period"></span>
          <span className="legend-text">Predicted Period</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ovulation-day"></span>
          <span className="legend-text">Ovulation ○</span>
        </div>
        <div className="legend-item">
          <span className="legend-color fertile-day"></span>
          <span className="legend-text">Fertile Window ◇</span>
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
  const [currentTheme, setCurrentTheme] = useState('default');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cycleTracker_theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

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

  // Handle theme change
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('cycleTracker_theme', theme);
  };

  // Handle date click
  const handleDateClick = (year, month, day) => {
    setSelectedDate({ year, month, day });
    setIsModalOpen(true);
  };

  // Handle quick add period
  const handleQuickAdd = async (flowIntensity) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const periodData = {
      start_date: todayStr,
      flow_intensity: flowIntensity,
      notes: `Quick added ${flowIntensity} flow`
    };

    try {
      await axios.post(`${API}/periods`, periodData);
      loadCalendarData(currentYear, currentMonth);
    } catch (error) {
      console.error('Error adding period:', error);
    }
  };

  // Save period
  const handleSavePeriod = async (periodData) => {
    try {
      await axios.post(`${API}/periods`, periodData);
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
        <div className="header-content">
          <div className="header-left">
            <h1>Cycle Tracker</h1>
            <p>Track your menstrual health with clarity and empowerment</p>
          </div>
          <div className="header-right">
            <ThemeSelector 
              currentTheme={currentTheme} 
              onThemeChange={handleThemeChange} 
            />
          </div>
        </div>
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
          <QuickAddPeriod onQuickAdd={handleQuickAdd} />
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