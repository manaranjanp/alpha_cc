import React from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header/Header';
import FileUpload from './components/FileUpload/FileUpload';
import StrategyConfig from './components/StrategyConfig/StrategyConfig';
import Results from './components/Results/Results';
import Stepper from './components/Stepper/Stepper';

function App() {
  const currentStep = useStore(state => state.currentStep);
  const isDataLoaded = useStore(state => state.isDataLoaded);
  const simulationResults = useStore(state => state.simulationResults);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Stepper />

        <div className="mt-8">
          {currentStep === 'upload' && <FileUpload />}
          {currentStep === 'configure' && isDataLoaded && <StrategyConfig />}
          {currentStep === 'results' && simulationResults.length > 0 && <Results />}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Investment Strategy Simulator - Educational purposes only. Not financial advice.</p>
          <p className="mt-2">Past performance does not guarantee future results.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
