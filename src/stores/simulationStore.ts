import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============== Type Definitions ==============

export type SimulationMode =
  | 'idle'
  | 'layout'
  | 'customer_flow'
  | 'heatmap'
  | 'demand'
  | 'inventory'
  | 'staff'
  | 'promotion';

export type SimulationStatus = 'stopped' | 'running' | 'paused' | 'completed';

export interface SimulationConfig {
  mode: SimulationMode;
  duration: number;      // seconds
  speed: number;         // multiplier
  parameters: Record<string, any>;
}

export interface EntityState {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  metadata: Record<string, any>;
  isSelected: boolean;
  isHighlighted: boolean;
}

export interface CustomerAgent {
  id: string;
  position: [number, number, number];
  targetZone: string | null;
  visitedZones: string[];
  behavior: 'browsing' | 'walking' | 'purchasing' | 'exiting';
  dwellTime: number;
  purchaseProbability: number;
}

export interface ZoneMetric {
  zoneId: string;
  zoneName: string;
  visitorCount: number;
  avgDwellTime: number;
  conversionRate: number;
  revenue: number;
  heatmapIntensity: number;
}

export interface SimulationResult {
  timestamp: number;
  metrics: {
    totalVisitors: number;
    totalRevenue: number;
    avgConversion: number;
    avgDwellTime: number;
    peakHour: number;
    bottleneckZones: string[];
  };
  zoneMetrics: ZoneMetric[];
  recommendations: string[];
}

// ============== Store State Interface ==============

interface SimulationState {
  // State
  status: SimulationStatus;
  config: SimulationConfig;
  currentTime: number;
  entities: Record<string, EntityState>;
  selectedEntityId: string | null;
  customers: CustomerAgent[];
  zoneMetrics: ZoneMetric[];
  results: SimulationResult | null;

  // Actions
  setConfig: (config: Partial<SimulationConfig>) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setEntities: (entities: Record<string, EntityState>) => void;
  updateEntity: (id: string, updates: Partial<EntityState>) => void;
  selectEntity: (id: string | null) => void;
  addCustomer: (customer: CustomerAgent) => void;
  updateCustomer: (id: string, updates: Partial<CustomerAgent>) => void;
  removeCustomer: (id: string) => void;
  updateZoneMetrics: (metrics: ZoneMetric[]) => void;
  tick: (deltaTime: number) => void;
  setResults: (results: SimulationResult) => void;
}

// ============== Store Implementation ==============

export const useSimulationStore = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    status: 'stopped',
    config: {
      mode: 'idle',
      duration: 3600,
      speed: 1,
      parameters: {},
    },
    currentTime: 0,
    entities: {},
    selectedEntityId: null,
    customers: [],
    zoneMetrics: [],
    results: null,

    // Configuration Actions
    setConfig: (config) =>
      set((state) => ({
        config: { ...state.config, ...config },
      })),

    // Simulation Control Actions
    startSimulation: () => set({ status: 'running' }),

    pauseSimulation: () => set({ status: 'paused' }),

    stopSimulation: () => set({ status: 'stopped', currentTime: 0 }),

    resetSimulation: () =>
      set({
        status: 'stopped',
        currentTime: 0,
        customers: [],
        zoneMetrics: [],
        results: null,
      }),

    // Entity Actions
    setEntities: (entities) => set({ entities }),

    updateEntity: (id, updates) =>
      set((state) => ({
        entities: {
          ...state.entities,
          [id]: { ...state.entities[id], ...updates },
        },
      })),

    selectEntity: (id) =>
      set((state) => {
        const entities = { ...state.entities };

        // Deselect previous entity
        if (state.selectedEntityId && entities[state.selectedEntityId]) {
          entities[state.selectedEntityId] = {
            ...entities[state.selectedEntityId],
            isSelected: false,
          };
        }

        // Select new entity
        if (id && entities[id]) {
          entities[id] = {
            ...entities[id],
            isSelected: true,
          };
        }

        return { selectedEntityId: id, entities };
      }),

    // Customer Agent Actions
    addCustomer: (customer) =>
      set((state) => ({
        customers: [...state.customers, customer],
      })),

    updateCustomer: (id, updates) =>
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

    removeCustomer: (id) =>
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      })),

    // Metrics Actions
    updateZoneMetrics: (metrics) => set({ zoneMetrics: metrics }),

    // Time Tick Action
    tick: (deltaTime) => {
      const state = get();
      if (state.status !== 'running') return;

      const newTime = state.currentTime + deltaTime * state.config.speed;

      if (newTime >= state.config.duration) {
        set({ status: 'completed', currentTime: state.config.duration });
        return;
      }

      set({ currentTime: newTime });
    },

    // Results Action
    setResults: (results) => set({ results }),
  }))
);

// ============== Selectors ==============

export const selectSimulationProgress = (state: SimulationState) =>
  state.config.duration > 0 ? (state.currentTime / state.config.duration) * 100 : 0;

export const selectActiveCustomerCount = (state: SimulationState) =>
  state.customers.filter((c) => c.behavior !== 'exiting').length;

export const selectZoneById = (zoneId: string) => (state: SimulationState) =>
  state.entities[zoneId];

export const selectZoneMetricById = (zoneId: string) => (state: SimulationState) =>
  state.zoneMetrics.find((m) => m.zoneId === zoneId);

export const selectTotalRevenue = (state: SimulationState) =>
  state.zoneMetrics.reduce((sum, z) => sum + z.revenue, 0);

export const selectAverageConversion = (state: SimulationState) => {
  const metrics = state.zoneMetrics;
  if (metrics.length === 0) return 0;
  return metrics.reduce((sum, z) => sum + z.conversionRate, 0) / metrics.length;
};

export default useSimulationStore;
