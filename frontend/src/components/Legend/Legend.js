import React from 'react';

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

// Use React.memo as this component's output doesn't change
export default React.memo(Legend);
