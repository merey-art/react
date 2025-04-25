import React, { createContext, useState } from 'react';

export const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const [analyticsData, setAnalyticsData] = useState([]);

  return (
    <AnalyticsContext.Provider value={{ analyticsData, setAnalyticsData }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
