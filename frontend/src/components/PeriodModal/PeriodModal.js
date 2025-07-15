import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import './PeriodModal.css';

const PeriodModal = ({ isOpen, onClose, selectedDate, onSave }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [flowIntensity, setFlowIntensity] = useState('medium');
    const [notes, setNotes] = useState('');
    const [predictedEndDate, setPredictedEndDate] = useState('');

    const existingPeriod = selectedDate?.existingPeriod;

    useEffect(() => {
        if (selectedDate) {
            const dateStr = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
            if (existingPeriod) {
                setStartDate(existingPeriod.start_date);
                setEndDate(existingPeriod.end_date || '');
                setFlowIntensity(existingPeriod.flow_intensity || 'medium');
                setNotes(existingPeriod.notes || '');
                setPredictedEndDate(''); // No prediction needed when editing
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

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="modal-content"
            overlayClassName="modal-overlay"
            contentLabel="Period Log Modal"
        >
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
        </Modal>
    );
};

export default PeriodModal;
