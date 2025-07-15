import React, { useState } from 'react';
import { themes } from './themes';
import './ThemeSelector.css';

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

export default ThemeSelector;
