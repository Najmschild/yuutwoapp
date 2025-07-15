import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

// Import Components
import Calendar from './components/Calendar/Calendar';
import PeriodModal from './components/PeriodModal/PeriodModal';
import CycleInsights from './components/CycleInsights/CycleInsights';
import Legend from './components/Legend/Legend';
import QuickAddPeriod from './components/QuickAddPeriod/QuickAddPeriod';
import ThemeSelector from './components/ThemeSelector/ThemeSelector';
import { themes } from './components/ThemeSelector/themes';

// Import Context
import { DataProvider } from './context/DataContext';

import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('default');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // --- THEME MANAGEMENT ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('cycleTracker_theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = useCallback((theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('cycleTracker_theme', theme);
  }, []);


  // --- DATA MANAGEMENT ---
  const loadCalendarData = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/calendar/${year}/${month}`);
      setCalendarData(response.data.calendar_data);
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Could not load calendar data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApiAction = useCallback(async (action, successMessage) => {
    try {
      await action();
      toast.success(successMessage);
      loadCalendarData(currentYear, currentMonth); // Refresh data on success
    } catch (error) {
      console.error('API Action failed:', error);
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
      toast.error(errorMessage);
    }
  }, [currentYear, currentMonth, loadCalendarData]);


  useEffect(() => {
    loadCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadCalendarData]);


  // --- UI HANDLERS ---
  const navigateMonth = useCallback((direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  }, []);

  const handleDateClick = useCallback((year, month, day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingPeriod = calendarData?.find(d => d.date === dateStr && d.is_period);
    setSelectedDate({ year, month, day, existingPeriod });
    setIsModalOpen(true);
  }, [calendarData]);

  const handleQuickAdd = useCallback((flowIntensity) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const periodData = { start_date: todayStr, flow_intensity: flowIntensity, notes: `Quick add` };
    handleApiAction(() => axios.post(`${API}/periods`, periodData), 'Period added successfully!');
  }, [handleApiAction]);

  const handleSavePeriod = useCallback((periodData) => {
    const isUpdating = selectedDate?.existingPeriod;
    handleApiAction(() => axios.post(`${API}/periods`, periodData), isUpdating ? 'Period updated!' : 'Period saved!');
  }, [handleApiAction, selectedDate]);


  return (
    <DataProvider value={{ calendarData, predictions }}>
      <div className="app">
        <Toaster position="top-center" reverseOrder={false} />
        <header className="app-header">
          <div className="header-content">
            <div className="header-left"><h1>Cycle Tracker</h1><p>Your personal health companion</p></div>
            <div className="header-right"><ThemeSelector currentTheme={currentTheme} onThemeChange={handleThemeChange} /></div>
          </div>
        </header>

        <main className="app-main">
          <div className="calendar-section">
            <div className="calendar-navigation">
              <button onClick={() => navigateMonth(-1)} className="nav-button">‹ Prev</button>
              <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => navigateMonth(1)} className="nav-button">Next ›</button>
            </div>
            
            {loading ? <div className="loading">Loading...</div> : <Calendar year={currentYear} month={currentMonth} onDateClick={handleDateClick} />}
          </div>

          <div className="sidebar">
            <QuickAddPeriod onQuickAdd={handleQuickAdd} />
            <CycleInsights />
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
    </DataProvider>
  );
}

export default App;
