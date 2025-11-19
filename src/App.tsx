import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SelectedStoreProvider } from "@/hooks/useSelectedStore";
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
import CustomerAnalysisPage from "@/features/store-analysis/customer/pages/CustomerAnalysisPage";

// Profit Center pages
import ProfitCenterPage from "@/features/profit-center/demand-inventory/pages/ProfitCenterPage";

// Cost Center pages
import ProductPerformancePage from "@/features/cost-center/automation/pages/ProductPerformancePage";

// Data Management pages
import UnifiedDataManagementPage from "@/features/data-management/import/pages/UnifiedDataManagementPage";
import GraphAnalysis from "@/features/data-management/ontology/pages/GraphAnalysisPage";
import SchemaBuilder from "@/features/data-management/ontology/pages/SchemaBuilderPage";
import Analytics from "@/features/data-management/analysis/pages/AnalyticsPage";
import BigDataAPIPage from "@/features/data-management/bigdata/pages/BigDataAPIPage";

// Digital Twin pages
import Setup3DDataPage from "@/features/digital-twin/pages/Setup3DDataPage";
import DigitalTwin3DPage from "@/features/digital-twin/pages/DigitalTwin3DPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SelectedStoreProvider>
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
              path="/customer-analysis"
              element={
                <ProtectedRoute>
                  <CustomerAnalysisPage />
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
                  <UnifiedDataManagementPage />
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
              path="/bigdata-api"
              element={
                <ProtectedRoute>
                  <BigDataAPIPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/digital-twin-3d"
              element={
                <ProtectedRoute>
                  <DigitalTwin3DPage />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </SelectedStoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
