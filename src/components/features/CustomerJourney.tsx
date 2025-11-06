import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, ShoppingBag, CreditCard, Star } from "lucide-react";

const journeySteps = [
  {
    icon: MapPin,
    title: "입장",
    time: "0분",
    description: "매장 입구 진입",
    color: "hsl(219 100% 85%)",
  },
  {
    icon: Clock,
    title: "탐색",
    time: "5-8분",
    description: "신상품 코너 둘러보기",
    color: "hsl(219 100% 75%)",
  },
  {
    icon: ShoppingBag,
    title: "상품 선택",
    time: "12-15분",
    description: "관심 상품 픽업 및 시착",
    color: "hsl(219 100% 65%)",
  },
  {
    icon: CreditCard,
    title: "구매 결정",
    time: "18-20분",
    description: "계산대 이동 및 결제",
    color: "hsl(var(--primary))",
  },
  {
    icon: Star,
    title: "퇴장",
    time: "22-25분",
    description: "만족도 평가 및 퇴장",
    color: "hsl(219 100% 55%)",
  },
];

export function CustomerJourney() {
  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">고객 여정 맵</CardTitle>
        <CardDescription>평균 구매 고객의 매장 체류 패턴</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {journeySteps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center animate-glow-pulse"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <span className="text-sm text-primary font-medium">{step.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < journeySteps.length - 1 && (
                <div className="ml-6 mt-2 mb-2">
                  <Separator orientation="vertical" className="h-8 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">평균 체류 시간</p>
          <p className="text-3xl font-bold gradient-text animate-glow-pulse">22분</p>
          <p className="text-xs text-muted-foreground mt-1">구매 고객 기준</p>
        </div>
      </CardContent>
    </Card>
  );
}
