import React from 'react';

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

export default React.memo(QuickAddPeriod);
