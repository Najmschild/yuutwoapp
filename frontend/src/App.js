import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

// --- THEME ---
const themes = {
    default: { name: 'Classic', description: 'Elegant purples and blues' },
    earth: { name: 'Earth Tones', description: 'Warm sage, brown, and beige' },
    monochrome: { name: 'Monochrome', description: 'Elegant blacks and whites' },
    calm: { name: 'Calm Neutrals', description: 'Soft blues and creams' },
    dark: { name: 'Dark Mode', description: 'Easy on the eyes' }
};

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
                <button className="theme-button" onClick={() => setIsOpen(!isOpen)}>
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


// --- QUICK ADD PERIOD ---
const QuickAddPeriod = ({ onQuickAdd }) => (
    <div className="quick-add-period">
        <h4>Quick Add</h4>
        <div className="quick-add-buttons">
            <button className="quick-add-btn flow-light" onClick={() => onQuickAdd('light')}>
                <span className="flow-icon">◦</span> Light
            </button>
            <button className="quick-add-btn flow-medium" onClick={() => onQuickAdd('medium')}>
                <span className="flow-icon">●</span> Medium
            </button>
            <button className="quick-add-btn flow-heavy" onClick={() => onQuickAdd('heavy')}>
                <span className="flow-icon">⬤</span> Heavy
            </button>
        </div>
        <p className="quick-add-note">Adds a period starting today.</p>
    </div>
);


// --- CALENDAR ---
const Calendar = ({ year, month, onDateClick, calendarData }) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getDayData = (day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarData?.find(data => data.date === dateStr);
    };

    const isToday = (day) => (
        today.getDate() === day &&
        today.getMonth() + 1 === month &&
        today.getFullYear() === year
    );

    // **CORRECTED**: Simplified class logic for better readability.
    const getDayClass = (day) => {
        const dayData = getDayData(day);
        let classes = 'calendar-day';
        if (isToday(day)) classes += ' today';
        if (!dayData) return classes;

        if (dayData.is_period) classes += ` period-day flow-${dayData.flow_intensity || 'medium'}`;
        else if (dayData.is_predicted_period) classes += ' predicted-period';
        else if (dayData.is_ovulation) classes += ' ovulation-day';
        else if (dayData.is_fertile) classes += ' fertile-day';
        else if (dayData.phase === 'luteal') classes += ' luteal-phase';

        return classes;
    };

    const getFlowIcon = (intensity) => {
        switch (intensity) {
            case 'light': return '◦';
            case 'heavy': return '⬤';
            default: return '●';
        }
    };

    const renderCalendarDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = getDayData(day);
            days.push(
                <div key={day} className={getDayClass(day)} onClick={() => onDateClick(year, month, day)}>
                    <div className="day-content">
                        <span className="day-number">{day}</span>
                        {isToday(day) && <div className="today-indicator">TODAY</div>}
                        {dayData?.is_period && <div className="period-sticker"><span className="period-icon">{getFlowIcon(dayData.flow_intensity)}</span><span className="period-label">Period</span></div>}
                        {dayData?.is_predicted_period && <div className="predicted-sticker"><span className="predicted-icon">◦</span><span className="predicted-label">Expected</span></div>}
                        {dayData?.is_ovulation && <div className="ovulation-sticker"><span className="ovulation-icon">🥚</span><span className="ovulation-label">Ovulation</span></div>}
                        {dayData?.is_fertile && !dayData.is_ovulation && <div className="fertile-sticker"><span className="fertile-icon">🌱</span><span className="fertile-label">Fertile</span></div>}
                        {dayData?.notes && <div className="notes-sticker"><span className="notes-icon">📝</span></div>}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header"><h2>{monthNames[month - 1]} {year}</h2></div>
            <div className="calendar-grid">
                <div className="weekday-headers">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="weekday-header">{day}</div>)}</div>
                <div className="calendar-days">{renderCalendarDays()}</div>
            </div>
        </div>
    );
};

// --- PERIOD MODAL ---
const PeriodModal = ({ isOpen, onClose, selectedDate, onSave, existingPeriod }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [flowIntensity, setFlowIntensity] = useState('medium');
    const [notes, setNotes] = useState('');
    const [predictedEndDate, setPredictedEndDate] = useState('');

    // **CORRECTED**: Properly populates the form for both new and existing periods.
    useEffect(() => {
        if (selectedDate) {
            const dateStr = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
            if (existingPeriod) {
                setStartDate(existingPeriod.start_date);
                setEndDate(existingPeriod.end_date || '');
                setFlowIntensity(existingPeriod.flow_intensity || 'medium');
                setNotes(existingPeriod.notes || '');
            } else {
                setStartDate(dateStr);
                setEndDate('');
                setFlowIntensity('medium');
                setNotes('');
                const startDateObj = new Date(dateStr);
                const predictedEnd = new Date(startDateObj);
                predictedEnd.setDate(predictedEnd.getDate() + 4);
                setPredictedEndDate(predictedEnd.toISOString().split('T')[0]);
            }
        }
    }, [selectedDate, existingPeriod]);

    const handleSave = () => {
        onSave({
            start_date: startDate,
            end_date: endDate || null,
            flow_intensity: flowIntensity,
            notes: notes || null
        });
        onClose();
    };

    const handleUsePrediction = () => setEndDate(predictedEndDate);

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
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <div className="date-input-with-prediction">
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Optional" />
                            {!endDate && predictedEndDate && (
                                <button type="button" className="prediction-button" onClick={handleUsePrediction}>
                                    Use predicted: {new Date(predictedEndDate).toLocaleDateString()}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Flow Intensity</label>
                        <div className="flow-selector">
                            {['light', 'medium', 'heavy'].map(intensity => (
                                <button key={intensity} type="button" className={`flow-option ${flowIntensity === intensity ? 'active' : ''} flow-${intensity}`} onClick={() => setFlowIntensity(intensity)}>
                                    <span className="flow-icon">{intensity === 'light' ? '◦' : intensity === 'medium' ? '●' : '⬤'}</span>
                                    <span className="flow-label">{intensity.charAt(0).toUpperCase() + intensity.slice(1)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling? Any symptoms or observations?" rows="3" />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>{existingPeriod ? 'Update Period' : 'Save Period'}</button>
                </div>
            </div>
        </div>
    );
};


// --- INSIGHTS & LEGEND ---
const CycleInsights = ({ predictions }) => {
    if (!predictions) return null;
    const getRegularityColor = (regularity) => {
        switch (regularity) {
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
                {predictions.average_cycle_length && <div className="insight-card"><div className="insight-icon">📊</div><div className="insight-content"><div className="insight-label">Average Cycle</div><div className="insight-value">{predictions.average_cycle_length} days</div></div></div>}
                <div className="insight-card"><div className="insight-icon">🎯</div><div className="insight-content"><div className="insight-label">Regularity</div><div className={`insight-value ${getRegularityColor(predictions.cycle_regularity)}`}>{predictions.cycle_regularity}</div></div></div>
                {predictions.next_period_start && <div className="insight-card"><div className="insight-icon">📅</div><div className="insight-content"><div className="insight-label">Next Period</div><div className="insight-value">{new Date(predictions.next_period_start).toLocaleDateString()}</div></div></div>}
                {predictions.next_ovulation && <div className="insight-card"><div className="insight-icon">🥚</div><div className="insight-content"><div className="insight-label">Next Ovulation</div><div className="insight-value">{new Date(predictions.next_ovulation).toLocaleDateString()}</div></div></div>}
            </div>
        </div>
    );
};

const Legend = () => (
    <div className="legend">
        <h4>Legend</h4>
        <div className="legend-items">
            <div className="legend-item"><span className="legend-color period-day flow-light"></span><span className="legend-text"><strong>Light Flow</strong> ◦</span></div>
            <div className="legend-item"><span className="legend-color period-day flow-medium"></span><span className="legend-text"><strong>Medium Flow</strong> ●</span></div>
            <div className="legend-item"><span className="legend-color period-day flow-heavy"></span><span className="legend-text"><strong>Heavy Flow</strong> ⬤</span></div>
            <div className="legend-item"><span className="legend-color predicted-period"></span><span className="legend-text">Predicted Period</span></div>
            <div className="legend-item"><span className="legend-color ovulation-day"></span><span className="legend-text">Ovulation</span></div>
            <div className="legend-item"><span className="legend-color fertile-day"></span><span className="legend-text">Fertile Window</span></div>
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---
function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // **CORRECTED**: State for handling API errors
    const [currentTheme, setCurrentTheme] = useState('default');

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    useEffect(() => {
        const savedTheme = localStorage.getItem('cycleTracker_theme');
        if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    // **CORRECTED**: Added error handling for user feedback.
    const loadCalendarData = async (year, month) => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            const response = await axios.get(`${API}/calendar/${year}/${month}`);
            setCalendarData(response.data.calendar_data);
            setPredictions(response.data.predictions);
        } catch (error) {
            console.error('Error loading calendar data:', error);
            setError('Could not load calendar data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleApiAction = async (action) => {
        setError(null);
        try {
            await action();
            loadCalendarData(currentYear, currentMonth); // Refresh data on success
        } catch (error) {
            console.error('API Action failed:', error);
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
        }
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('cycleTracker_theme', theme);
    };

    // **CORRECTED**: Finds existing period data to pass to the modal.
    const handleDateClick = (year, month, day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existingPeriod = calendarData?.find(d => d.date === dateStr && d.is_period);
        setSelectedDate({ year, month, day, existingPeriod });
        setIsModalOpen(true);
    };
    
    const handleQuickAdd = (flowIntensity) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const periodData = { start_date: todayStr, flow_intensity: flowIntensity, notes: `Quick add` };
        handleApiAction(() => axios.post(`${API}/periods`, periodData));
    };

    const handleSavePeriod = (periodData) => {
        handleApiAction(() => axios.post(`${API}/periods`, periodData));
    };

    useEffect(() => {
        loadCalendarData(currentYear, currentMonth);
    }, [currentYear, currentMonth]);

    return (
        <div className="app">
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
                    
                    {/* **CORRECTED**: Display loading and error messages */}
                    {error && <div className="error-message">{error} <button onClick={() => setError(null)}>×</button></div>}
                    {loading ? <div className="loading">Loading...</div> : <Calendar year={currentYear} month={currentMonth} onDateClick={handleDateClick} calendarData={calendarData} />}
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
                existingPeriod={selectedDate?.existingPeriod} // **CORRECTED**: Pass existing period data
            />
        </div>
    );
}

export default App;
