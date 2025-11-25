import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  requireValidLicense?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/", 
  requireValidLicense = false 
}: RoleGuardProps) {
  const { role, licenseStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // Check role permission
  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            이 페이지에 접근할 권한이 없습니다. 필요한 역할: {allowedRoles.join(", ")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check license status if required
  if (requireValidLicense && licenseStatus !== "assigned" && licenseStatus !== "active") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            유효한 라이선스가 필요합니다. 현재 라이선스 상태: {licenseStatus || "없음"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
