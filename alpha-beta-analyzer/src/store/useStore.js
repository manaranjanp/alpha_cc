import { create } from 'zustand';

export const useStore = create((set) => ({
  // Step management
  currentStep: 'upload',
  setCurrentStep: (step) => set({ currentStep: step }),

  // Data state
  isDataLoaded: false,
  parsedData: null,
  validationReport: null,

  // Column information
  stockColumns: [],
  indexColumns: [],

  // User settings
  selectedStock: '',
  selectedIndex: '',
  riskFreeRate: 5.0,
  period: 260, // 5 years in weeks

  // Analysis results
  weeklyReturnsData: null,
  alignedData: null,
  analysisResults: null,
  rollingResults: null,
  simulationResults: [],

  // Actions
  setDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
  setParsedData: (data) => set({ parsedData: data }),
  setValidationReport: (report) => set({ validationReport: report }),

  setStockColumns: (columns) => set({ stockColumns: columns }),
  setIndexColumns: (columns) => set({ indexColumns: columns }),

  setSelectedStock: (stock) => set({ selectedStock: stock }),
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  setRiskFreeRate: (rate) => set({ riskFreeRate: rate }),
  setPeriod: (period) => set({ period }),

  setWeeklyReturnsData: (data) => set({ weeklyReturnsData: data }),
  setAlignedData: (data) => set({ alignedData: data }),
  setAnalysisResults: (results) => set({ analysisResults: results }),
  setRollingResults: (results) => set({ rollingResults: results }),
  setSimulationResults: (results) => set({ simulationResults: results }),

  // Reset function
  reset: () => set({
    currentStep: 'upload',
    isDataLoaded: false,
    parsedData: null,
    validationReport: null,
    stockColumns: [],
    indexColumns: [],
    selectedStock: '',
    selectedIndex: '',
    riskFreeRate: 5.0,
    period: 260,
    weeklyReturnsData: null,
    alignedData: null,
    analysisResults: null,
    rollingResults: null,
    simulationResults: [],
  }),
}));
