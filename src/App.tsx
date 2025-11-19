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

// Overview pages
import Stores from "@/features/store-analysis/stores/pages/StoresPage";
import DigitalTwin3DPage from "@/features/digital-twin/pages/DigitalTwin3DPage";

// Analysis - Store Analysis pages
import FootfallAnalysis from "@/features/store-analysis/footfall/pages/FootfallAnalysisPage";
import TrafficHeatmapPage from "@/features/store-analysis/footfall/pages/TrafficHeatmapPage";
import CustomerJourneyPage from "@/features/store-analysis/footfall/pages/CustomerJourneyPage";
import ConversionFunnelPage from "@/features/store-analysis/footfall/pages/ConversionFunnelPage";
import CustomerAnalysisPage from "@/features/store-analysis/customer/pages/CustomerAnalysisPage";

// Analysis - Operational Analysis pages
import Inventory from "@/features/store-analysis/inventory/pages/InventoryPage";
import ProfitCenterPage from "@/features/profit-center/demand-inventory/pages/ProfitCenterPage";
import Analytics from "@/features/data-management/analysis/pages/AnalyticsPage";

// Simulation pages
import DemandInventorySimPage from "@/features/simulation/pages/DemandInventorySimPage";
import PricingSimPage from "@/features/simulation/pages/PricingSimPage";
import RecommendationSimPage from "@/features/simulation/pages/RecommendationSimPage";
import ScenarioLabPage from "@/features/simulation/pages/ScenarioLabPage";
import LayoutSimPage from "@/features/simulation/pages/LayoutSimPage";
import StaffEfficiencySimPage from "@/features/simulation/pages/StaffEfficiencySimPage";

// Data Management pages
import UnifiedDataManagementPage from "@/features/data-management/import/pages/UnifiedDataManagementPage";
import SchemaBuilder from "@/features/data-management/ontology/pages/SchemaBuilderPage";
import GraphAnalysis from "@/features/data-management/ontology/pages/GraphAnalysisPage";
import BigDataAPIPage from "@/features/data-management/bigdata/pages/BigDataAPIPage";
import NeuralSenseSettingsPage from "@/features/data-management/neuralsense/pages/NeuralSenseSettingsPage";

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
              
              {/* 1️⃣ Overview */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/stores" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/digital-twin-3d" element={<ProtectedRoute><DigitalTwin3DPage /></ProtectedRoute>} />

              {/* 2️⃣ Analysis - Store Analysis */}
              <Route path="/analysis/footfall" element={<ProtectedRoute><FootfallAnalysis /></ProtectedRoute>} />
              <Route path="/analysis/traffic-heatmap" element={<ProtectedRoute><TrafficHeatmapPage /></ProtectedRoute>} />
              <Route path="/analysis/customer-journey" element={<ProtectedRoute><CustomerJourneyPage /></ProtectedRoute>} />
              <Route path="/analysis/conversion-funnel" element={<ProtectedRoute><ConversionFunnelPage /></ProtectedRoute>} />
              <Route path="/analysis/customer-analysis" element={<ProtectedRoute><CustomerAnalysisPage /></ProtectedRoute>} />

              {/* 2️⃣ Analysis - Operational Analysis */}
              <Route path="/analysis/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/analysis/profit-center" element={<ProtectedRoute><ProfitCenterPage /></ProtectedRoute>} />
              <Route path="/analysis/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

              {/* 3️⃣ Simulation */}
              <Route path="/simulation/demand-inventory" element={<ProtectedRoute><DemandInventorySimPage /></ProtectedRoute>} />
              <Route path="/simulation/pricing" element={<ProtectedRoute><PricingSimPage /></ProtectedRoute>} />
              <Route path="/simulation/recommendation" element={<ProtectedRoute><RecommendationSimPage /></ProtectedRoute>} />
              <Route path="/simulation/scenario-lab" element={<ProtectedRoute><ScenarioLabPage /></ProtectedRoute>} />
              <Route path="/simulation/layout" element={<ProtectedRoute><LayoutSimPage /></ProtectedRoute>} />
              <Route path="/simulation/staff-efficiency" element={<ProtectedRoute><StaffEfficiencySimPage /></ProtectedRoute>} />

              {/* 4️⃣ Data Management */}
              <Route path="/data-import" element={<ProtectedRoute><UnifiedDataManagementPage /></ProtectedRoute>} />
              <Route path="/schema-builder" element={<ProtectedRoute><SchemaBuilder /></ProtectedRoute>} />
              <Route path="/graph-analysis" element={<ProtectedRoute><GraphAnalysis /></ProtectedRoute>} />
              <Route path="/bigdata-api" element={<ProtectedRoute><BigDataAPIPage /></ProtectedRoute>} />
              <Route path="/neuralsense-settings" element={<ProtectedRoute><NeuralSenseSettingsPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SelectedStoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
