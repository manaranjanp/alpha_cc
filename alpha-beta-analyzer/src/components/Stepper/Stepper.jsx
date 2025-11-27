import React from 'react';
import { useStore } from '../../store/useStore';

const steps = [
  { id: 'upload', number: 1, title: 'Upload Data', subtitle: 'Upload your price data' },
  { id: 'configure', number: 2, title: 'Configure Strategies', subtitle: 'Select and configure strategies' },
  { id: 'results', number: 3, title: 'View Results', subtitle: 'Analyze performance' },
];

function Stepper() {
  const currentStep = useStore(state => state.currentStep);
  const isDataLoaded = useStore(state => state.isDataLoaded);
  const simulationResults = useStore(state => state.simulationResults);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  const isStepCompleted = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    return stepIndex < currentStepIndex;
  };

  const isStepActive = (stepId) => {
    return stepId === currentStep;
  };

  const isStepAccessible = (stepId) => {
    if (stepId === 'upload') return true;
    if (stepId === 'configure') return isDataLoaded;
    if (stepId === 'results') return simulationResults.length > 0;
    return false;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 md:p-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div className="flex flex-col items-center relative">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300
                    ${isStepCompleted(step.id)
                      ? 'bg-primary-600 text-white'
                      : isStepActive(step.id)
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : isStepAccessible(step.id)
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                          : 'bg-gray-200 text-gray-400'
                    }
                  `}
                >
                  {isStepCompleted(step.id) ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-3 text-center">
                  <div
                    className={`
                      text-sm font-semibold
                      ${isStepActive(step.id) ? 'text-primary-600' : 'text-gray-700'}
                    `}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 hidden md:block">
                    {step.subtitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-1 flex-1 mx-2 transition-all duration-300 -mt-16
                  ${isStepCompleted(steps[index + 1].id) ? 'bg-primary-600' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Stepper;
