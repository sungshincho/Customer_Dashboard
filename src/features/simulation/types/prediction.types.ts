/**
 * AI 예측 결과 타입
 */

import { KpiSnapshot } from './scenario.types';

export interface PredictionRequest {
  scenarioType: string;
  params: Record<string, any>;
  storeId?: string;
  baselineData?: any;
}

export interface PredictionResult {
  scenarioId?: string;
  predictedKpi: KpiSnapshot;
  confidenceScore: number;
  aiInsights: string;
  recommendations?: string[];
  warnings?: string[];
  metadata?: {
    modelVersion?: string;
    processingTime?: number;
    dataQuality?: number;
  };
}

export interface SimulationResult {
  id: string;
  scenarioId: string;
  resultType: string;
  resultData: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ABTestResult {
  scenarioA: {
    id: string;
    name: string;
    kpi: KpiSnapshot;
  };
  scenarioB: {
    id: string;
    name: string;
    kpi: KpiSnapshot;
  };
  winner?: 'A' | 'B' | 'tie';
  winnerConfidence?: number;
  comparison: Array<{
    metric: string;
    deltaPercent: number;
    significance: 'high' | 'medium' | 'low';
  }>;
}
