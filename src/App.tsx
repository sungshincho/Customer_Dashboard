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
import HQStoreSyncPage from "@/features/store-analysis/stores/pages/HQStoreSyncPage";

// Analysis - Integrated pages
import StoreAnalysisPage from "@/features/store-analysis/pages/StoreAnalysisPage";
import CustomerAnalysisIntegratedPage from "@/features/store-analysis/pages/CustomerAnalysisIntegratedPage";
import ProductAnalysisPage from "@/features/store-analysis/pages/ProductAnalysisPage";

// Simulation pages
import DigitalTwin3DPage from "@/features/digital-twin/pages/DigitalTwin3DPage";
import ScenarioLabPage from "@/features/simulation/pages/ScenarioLabPage";
import LayoutSimPage from "@/features/simulation/pages/LayoutSimPage";
import DemandInventorySimPage from "@/features/simulation/pages/DemandInventorySimPage";
import PricingSimPage from "@/features/simulation/pages/PricingSimPage";
import RecommendationSimPage from "@/features/simulation/pages/RecommendationSimPage";

// Data Management pages
import UnifiedDataManagementPage from "@/features/data-management/import/pages/UnifiedDataManagementPage";
import SchemaBuilder from "@/features/data-management/ontology/pages/SchemaBuilderPage";
import GraphAnalysis from "@/features/data-management/ontology/pages/GraphAnalysisPage";
import BigDataAPIPage from "@/features/data-management/bigdata/pages/BigDataAPIPage";
import Analytics from "@/features/data-management/analysis/pages/AnalyticsPage";

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
              
              {/* 1️⃣ Overview (4 pages) */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/stores" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
              <Route path="/hq-store-sync" element={<ProtectedRoute><HQStoreSyncPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* 2️⃣ Analysis - Integrated Store Analysis (3 pages) */}
              <Route path="/analysis/store" element={<ProtectedRoute><StoreAnalysisPage /></ProtectedRoute>} />
              <Route path="/analysis/customer" element={<ProtectedRoute><CustomerAnalysisIntegratedPage /></ProtectedRoute>} />
              <Route path="/analysis/product" element={<ProtectedRoute><ProductAnalysisPage /></ProtectedRoute>} />

              {/* 3️⃣ Simulation (6 pages) */}
              <Route path="/digital-twin-3d" element={<ProtectedRoute><DigitalTwin3DPage /></ProtectedRoute>} />
              <Route path="/simulation/twin-lab" element={<ProtectedRoute><ScenarioLabPage /></ProtectedRoute>} />
              <Route path="/simulation/layout" element={<ProtectedRoute><LayoutSimPage /></ProtectedRoute>} />
              <Route path="/simulation/demand-inventory" element={<ProtectedRoute><DemandInventorySimPage /></ProtectedRoute>} />
              <Route path="/simulation/pricing" element={<ProtectedRoute><PricingSimPage /></ProtectedRoute>} />
              <Route path="/simulation/recommendation" element={<ProtectedRoute><RecommendationSimPage /></ProtectedRoute>} />

              {/* 4️⃣ Data Management (5 pages) */}
              <Route path="/data-import" element={<ProtectedRoute><UnifiedDataManagementPage /></ProtectedRoute>} />
              <Route path="/schema-builder" element={<ProtectedRoute><SchemaBuilder /></ProtectedRoute>} />
              <Route path="/graph-analysis" element={<ProtectedRoute><GraphAnalysis /></ProtectedRoute>} />
              <Route path="/bigdata-api" element={<ProtectedRoute><BigDataAPIPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SelectedStoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
