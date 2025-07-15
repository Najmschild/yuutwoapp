import React from 'react';
import { useData } from '../../context/DataContext';
import './Calendar.css';

const Calendar = ({ year, month, onDateClick }) => {
    const { calendarData } = useData(); // Consume data from context

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const today = new Date();

    const getDayData = (day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarData?.find(data => data.date === dateStr);
    };

    const isToday = (day) => (
        today.getDate() === day &&
        today.getMonth() + 1 === month &&
        today.getFullYear() === year
    );

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
            <div className="calendar-grid">
                <div className="weekday-headers">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="weekday-header">{day}</div>)}</div>
                <div className="calendar-days">{renderCalendarDays()}</div>
            </div>
        </div>
    );
};

export default Calendar;
