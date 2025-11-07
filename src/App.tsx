import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Stores from "./pages/Stores";
import Analytics from "./pages/Analytics";
import Inventory from "./pages/Inventory";
import Forecasts from "./pages/Forecasts";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import FootfallAnalysis from "./pages/FootfallAnalysis";
import DemandForecastPage from "./pages/DemandForecastPage";
import TrafficHeatmapPage from "./pages/TrafficHeatmapPage";
import ProductPerformancePage from "./pages/ProductPerformancePage";
import InventoryOptimizerPage from "./pages/InventoryOptimizerPage";
import LayoutSimulatorPage from "./pages/LayoutSimulatorPage";
import StaffEfficiencyPage from "./pages/StaffEfficiencyPage";
import CustomerJourneyPage from "./pages/CustomerJourneyPage";
import ConversionFunnelPage from "./pages/ConversionFunnelPage";
import HQStoreSyncPage from "./pages/HQStoreSyncPage";
import DataImport from "./pages/DataImport";
import GraphAnalysis from "./pages/GraphAnalysis";

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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
