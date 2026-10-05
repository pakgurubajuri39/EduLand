import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EduLand uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl mb-4">
            📖
          </div>
          <h1 className="text-2xl font-black text-amber-300 mb-2">EduLand Builder Jump</h1>
          <p className="text-slate-300 text-sm max-w-md mb-6 leading-relaxed">
            Terjadi pemulihan halaman (*page recovery*). Klik tombol di bawah untuk memuat ulang game.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-colors"
          >
            Muat Ulang Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

