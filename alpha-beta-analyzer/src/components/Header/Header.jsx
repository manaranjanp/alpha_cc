import React from 'react';
import { useStore } from '../../store/useStore';

function Header() {
  const reset = useStore(state => state.reset);

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? All data and settings will be lost.')) {
      reset();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investment Strategy Simulator</h1>
            <p className="text-gray-600 mt-1">Compare backtesting results for different investment strategies</p>
          </div>
          <button
            onClick={handleStartOver}
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
