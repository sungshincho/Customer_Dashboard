import { Lock, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureFlagConfig } from "@/config/featureFlags";

interface LockedFeatureProps {
  tier: 1 | 2 | 3;
  title: string;
  description: string;
  config?: FeatureFlagConfig;
  children?: React.ReactNode;
  className?: string;
}

const TIER_INFO = {
  1: {
    label: "Tier 1",
    color: "bg-green-500",
    icon: Zap,
    badge: "기본 데이터",
  },
  2: {
    label: "Tier 2",
    color: "bg-yellow-500",
    icon: Sparkles,
    badge: "외부 API 연동",
  },
  3: {
    label: "Tier 3",
    color: "bg-red-500",
    icon: Sparkles,
    badge: "AI 추론",
  },
} as const;

export function LockedFeature({
  tier,
  title,
  description,
  config,
  children,
  className = "",
}: LockedFeatureProps) {
  const tierInfo = TIER_INFO[tier];
  const Icon = tierInfo.icon;

  // 기능이 활성화되었으면 children 표시
  if (config?.enabled) {
    return <>{children}</>;
  }

  // 미활성화 상태 UI
  return (
    <Card className={`relative border-dashed ${className}`}>
      <div className="absolute inset-0 bg-muted/30 backdrop-blur-[2px] rounded-lg z-10" />
      
      <CardHeader className="relative z-20">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <Badge variant="outline" className={tierInfo.color + " text-white"}>
            {tierInfo.label}
          </Badge>
          <Badge variant="secondary">{tierInfo.badge}</Badge>
        </div>
        
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        
        <CardDescription>{description}</CardDescription>

        {config?.requiredAPI && config.requiredAPI.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">필요한 연동:</p>
            <div className="flex flex-wrap gap-1">
              {config.requiredAPI.map((api) => (
                <Badge key={api} variant="outline" className="text-xs">
                  {api}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {config?.requiredData && config.requiredData.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">필요한 데이터:</p>
            <div className="flex flex-wrap gap-1">
              {config.requiredData.map((data) => (
                <Badge key={data} variant="outline" className="text-xs">
                  {data}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative z-20">
        <Button variant="outline" disabled className="w-full">
          <Lock className="w-4 h-4 mr-2" />
          {tierInfo.label} 개발 진행 중
        </Button>
      </CardContent>
    </Card>
  );
}
