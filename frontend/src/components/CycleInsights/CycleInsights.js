import React from 'react';
import { useData } from '../../context/DataContext';

const CycleInsights = () => {
    const { predictions } = useData();

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

export default React.memo(CycleInsights);
