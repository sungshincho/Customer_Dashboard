import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SelectedStoreProvider } from "@/hooks/useSelectedStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Core pages
import Auth from "@/core/pages/AuthPage";
import NotFound from "@/core/pages/NotFoundPage";

// 4개 메인 페이지 (확정 아키텍처)
import InsightHubPage from "@/features/insights/InsightHubPage";
import DigitalTwinStudioPage from "@/features/studio/DigitalTwinStudioPage";
import ROIMeasurementPage from "@/features/roi/ROIMeasurementPage";
import SettingsPage from "@/features/settings/SettingsPage";

// Onboarding
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

                {/* 새로운 4개 메인 라우트 */}
                <Route path="/" element={<ProtectedRoute><InsightHubPage /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><InsightHubPage /></ProtectedRoute>} />
                <Route path="/studio" element={<ProtectedRoute><DigitalTwinStudioPage /></ProtectedRoute>} />
                <Route path="/roi" element={<ProtectedRoute><ROIMeasurementPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                {/* 레거시 라우트 리다이렉트 (하위 호환성) */}
                <Route path="/overview/dashboard" element={<Navigate to="/insights" replace />} />
                <Route path="/overview/stores" element={<Navigate to="/settings?tab=stores" replace />} />
                <Route path="/overview/hq-communication" element={<Navigate to="/insights" replace />} />
                <Route path="/overview/settings" element={<Navigate to="/settings" replace />} />
                <Route path="/analysis/store" element={<Navigate to="/insights?tab=store" replace />} />
                <Route path="/analysis/customer" element={<Navigate to="/insights?tab=customer" replace />} />
                <Route path="/analysis/product" element={<Navigate to="/insights?tab=product" replace />} />
                <Route path="/simulation/digital-twin" element={<Navigate to="/studio" replace />} />
                <Route path="/simulation/hub" element={<Navigate to="/studio?mode=simulation" replace />} />
                <Route path="/data-management/import" element={<Navigate to="/settings?tab=data" replace />} />
                <Route path="/data-management/schema" element={<Navigate to="/settings?tab=data" replace />} />
                <Route path="/data-management/api" element={<Navigate to="/settings?tab=data" replace />} />

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
