import React, { useContext } from 'react';

// Create a context with a default value
const DataContext = React.createContext({
  calendarData: null,
  predictions: null,
});

// Create a provider component
export const DataProvider = DataContext.Provider;

// Create a custom hook for easy consumption of the context
export const useData = () => {
    return useContext(DataContext);
};
