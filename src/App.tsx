import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Core pages
import Dashboard from "@/core/pages/DashboardPage";
import Auth from "@/core/pages/AuthPage";
import Settings from "@/core/pages/SettingsPage";
import NotFound from "@/core/pages/NotFoundPage";

// Store Analysis pages
import FootfallAnalysis from "@/features/store-analysis/footfall/pages/FootfallAnalysisPage";
import TrafficHeatmapPage from "@/features/store-analysis/footfall/pages/TrafficHeatmapPage";
import CustomerJourneyPage from "@/features/store-analysis/footfall/pages/CustomerJourneyPage";
import ConversionFunnelPage from "@/features/store-analysis/footfall/pages/ConversionFunnelPage";
import Stores from "@/features/store-analysis/stores/pages/StoresPage";
import HQStoreSyncPage from "@/features/store-analysis/stores/pages/HQStoreSyncPage";
import Inventory from "@/features/store-analysis/inventory/pages/InventoryPage";

// Profit Center pages
import ProfitCenterPage from "@/features/profit-center/demand-inventory/pages/ProfitCenterPage";
import DemandForecastPage from "@/features/profit-center/demand-inventory/pages/DemandForecastPage";
import Forecasts from "@/features/profit-center/demand-inventory/pages/ForecastsPage";
import InventoryOptimizerPage from "@/features/profit-center/demand-inventory/pages/InventoryOptimizerPage";
import PricingOptimizerPage from "@/features/profit-center/pricing/pages/PricingOptimizerPage";
import CustomerRecommendationsPage from "@/features/profit-center/personalization/pages/CustomerRecommendationsPage";
import LayoutSimulatorPage from "@/features/profit-center/personalization/pages/LayoutSimulatorPage";

// Cost Center pages
import ProductPerformancePage from "@/features/cost-center/automation/pages/ProductPerformancePage";
import StaffEfficiencyPage from "@/features/cost-center/automation/pages/StaffEfficiencyPage";

// Data Management pages
import DataImport from "@/features/data-management/import/pages/DataImportPage";
import GraphAnalysis from "@/features/data-management/ontology/pages/GraphAnalysisPage";
import SchemaBuilder from "@/features/data-management/ontology/pages/SchemaBuilderPage";
import Analytics from "@/features/data-management/analysis/pages/AnalyticsPage";
import NeuralSenseSettingsPage from "@/features/data-management/neuralsense/pages/NeuralSenseSettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stores"
              element={
                <ProtectedRoute>
                  <Stores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forecasts"
              element={
                <ProtectedRoute>
                  <Forecasts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/footfall-analysis"
              element={
                <ProtectedRoute>
                  <FootfallAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/demand-forecast"
              element={
                <ProtectedRoute>
                  <DemandForecastPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/traffic-heatmap"
              element={
                <ProtectedRoute>
                  <TrafficHeatmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-performance"
              element={
                <ProtectedRoute>
                  <ProductPerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory-optimizer"
              element={
                <ProtectedRoute>
                  <InventoryOptimizerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/layout-simulator"
              element={
                <ProtectedRoute>
                  <LayoutSimulatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-efficiency"
              element={
                <ProtectedRoute>
                  <StaffEfficiencyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer-journey"
              element={
                <ProtectedRoute>
                  <CustomerJourneyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversion-funnel"
              element={
                <ProtectedRoute>
                  <ConversionFunnelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hq-store-sync"
              element={
                <ProtectedRoute>
                  <HQStoreSyncPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-import"
              element={
                <ProtectedRoute>
                  <DataImport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/graph-analysis"
              element={
                <ProtectedRoute>
                  <GraphAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schema-builder"
              element={
                <ProtectedRoute>
                  <SchemaBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profit-center"
              element={
                <ProtectedRoute>
                  <ProfitCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing-optimizer"
              element={
                <ProtectedRoute>
                  <PricingOptimizerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer-recommendations"
              element={
                <ProtectedRoute>
                  <CustomerRecommendationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/neuralsense-settings"
              element={
                <ProtectedRoute>
                  <NeuralSenseSettingsPage />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
