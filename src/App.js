import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const ThemedToaster = () => {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#161616' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#111827',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#161616' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#161616' : '#ffffff',
          },
        },
      }}
    />
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedToaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:roomId" element={<EditorPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
