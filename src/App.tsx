import React, { useState, useEffect } from "react";
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

// A. Overview pages
import { StoresPage, HQCommunicationPage } from "@/features/overview";

// B. Analysis pages
import { StoreAnalysisPage, CustomerAnalysisPage, ProductAnalysisPage } from "@/features/analysis";

// C. Simulation pages
import { DigitalTwin3DPage, SimulationHubPage } from "@/features/simulation";

// D. Data Management pages
import UnifiedDataManagementPage from "@/features/data-management/import/pages/UnifiedDataManagementPage";
import SchemaBuilder from "@/features/data-management/ontology/pages/SchemaBuilderPage";
import APIIntegrationPage from "@/features/data-management/api/pages/APIIntegrationPage";

// E. Onboarding (신규 추가)
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";
import { useIsOnboardingComplete } from "@/hooks/useOnboarding";

const queryClient = new QueryClient();

// 온보딩 래퍼 컴포넌트 (Hook 사용을 위해 분리)
function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isComplete, isLoading } = useIsOnboardingComplete();

  // 온보딩 미완료 시 자동 표시
  useEffect(() => {
    if (!isLoading && !isComplete) {
      setShowOnboarding(true);
    }
  }, [isComplete, isLoading]);

  return (
    <>
      {children}
      <OnboardingWizard 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding} 
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SelectedStoreProvider>
            {/* 온보딩 래퍼로 감싸기 */}
            <OnboardingWrapper>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                
                {/* A. Overview (4 pages) */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/overview/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/overview/stores" element={<ProtectedRoute><StoresPage /></ProtectedRoute>} />
                <Route path="/overview/hq-communication" element={<ProtectedRoute><HQCommunicationPage /></ProtectedRoute>} />
                <Route path="/overview/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* B. 매장 현황 분석 (3 pages) */}
                <Route path="/analysis/store" element={<ProtectedRoute><StoreAnalysisPage /></ProtectedRoute>} />
                <Route path="/analysis/customer" element={<ProtectedRoute><CustomerAnalysisPage /></ProtectedRoute>} />
                <Route path="/analysis/product" element={<ProtectedRoute><ProductAnalysisPage /></ProtectedRoute>} />

                {/* C. 시뮬레이션 (2 pages) */}
                <Route path="/simulation/digital-twin" element={<ProtectedRoute><DigitalTwin3DPage /></ProtectedRoute>} />
                <Route path="/simulation/hub" element={<ProtectedRoute><SimulationHubPage /></ProtectedRoute>} />

                {/* D. 데이터 관리 (3 pages) */}
                <Route path="/data-management/import" element={<ProtectedRoute><UnifiedDataManagementPage /></ProtectedRoute>} />
                <Route path="/data-management/schema" element={<ProtectedRoute><SchemaBuilder /></ProtectedRoute>} />
                <Route path="/data-management/api" element={<ProtectedRoute><APIIntegrationPage /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </OnboardingWrapper>
          </SelectedStoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
