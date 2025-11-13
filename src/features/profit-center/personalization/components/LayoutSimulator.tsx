import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface LayoutSimulatorProps {
  visitsData?: any[];
  purchasesData?: any[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sales: number;
  conversion: number;
}

export const LayoutSimulator = ({ visitsData = [], purchasesData = [] }: LayoutSimulatorProps) => {
  // 실제 데이터 기반으로 초기 상품 배치 생성
  const initialProducts: Product[] = useMemo(() => {
    if (purchasesData.length === 0) return [];

    // 구매 데이터에서 상위 판매 상품 추출
    const productSales = new Map<string, { name: string; count: number; }>();
    purchasesData.forEach((p: any) => {
      const productName = p.product_name || p.name || '상품';
      const current = productSales.get(productName) || { name: productName, count: 0 };
      productSales.set(productName, {
        name: productName,
        count: current.count + (parseInt(p.quantity) || 1)
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return topProducts.map((product, idx) => ({
      id: `prod-${idx}`,
      name: product.name.substring(0, 10),
      category: idx < 2 ? '아우터' : idx < 4 ? '상의' : idx < 6 ? '하의' : '신발',
      x: 20 + (idx % 4) * 20,
      y: 25 + Math.floor(idx / 4) * 35,
      width: 15,
      height: 15,
      sales: product.count,
      conversion: 10 + Math.random() * 5
    }));
  }, [purchasesData]);

  // AI 최적화 레이아웃 (입구 근처, 중앙 배치)
  const aiSuggestedLayout: Product[] = useMemo(() => {
    return initialProducts.map((product, idx) => ({
      ...product,
      x: idx < 4 ? 25 + idx * 15 : 25 + (idx - 4) * 15,
      y: idx < 4 ? 20 : 50
    }));
  }, [initialProducts]);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [isAiLayout, setIsAiLayout] = useState(false);

const generateMetrics = (products: Product[]) => {
  // 상품 위치 기반 성과 예측 (입구에 가까울수록, 중앙에 가까울수록 성과 증가)
  const totalSales = products.reduce((sum, p) => {
    const entranceProximity = (100 - p.y) / 100; // 위쪽(입구)에 가까울수록 높음
    const centerProximity = 1 - Math.abs(50 - p.x) / 50; // 중앙에 가까울수록 높음
    const locationBonus = (entranceProximity * 0.3 + centerProximity * 0.2) * 100;
    return sum + p.sales + locationBonus;
  }, 0);
  
  const avgConversion = products.reduce((sum, p) => {
    const entranceProximity = (100 - p.y) / 100;
    const centerProximity = 1 - Math.abs(50 - p.x) / 50;
    const conversionBonus = (entranceProximity * 2 + centerProximity * 1.5);
    return sum + p.conversion + conversionBonus;
  }, 0) / products.length;
  
  const avgTraffic = products.reduce((sum, p) => {
    const visibility = ((100 - p.y) / 100) * 200;
    return sum + visibility;
  }, 0);
  
  return {
    conversion: Math.round(avgConversion * 10) / 10,
    traffic: Math.round(450 + avgTraffic),
    dwell: Math.round(180 + products.length * 10),
  };
};

  const metrics = generateMetrics(products);
  const aiMetrics = generateMetrics(aiSuggestedLayout);

  const chartData = [
    { time: "Mon", current: metrics.conversion, optimized: aiMetrics.conversion },
    { time: "Tue", current: metrics.conversion + 1, optimized: aiMetrics.conversion + 1.5 },
    { time: "Wed", current: metrics.conversion - 0.5, optimized: aiMetrics.conversion + 2 },
    { time: "Thu", current: metrics.conversion + 0.8, optimized: aiMetrics.conversion + 2.5 },
    { time: "Fri", current: metrics.conversion + 2, optimized: aiMetrics.conversion + 3.5 },
    { time: "Sat", current: metrics.conversion + 3, optimized: aiMetrics.conversion + 5 },
    { time: "Sun", current: metrics.conversion + 2.5, optimized: aiMetrics.conversion + 4.5 },
  ];

  const handleDragStart = (productId: string) => {
    setDraggedProduct(productId);
    setIsAiLayout(false); // 수동 조정 시 AI 모드 해제
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedProduct) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === draggedProduct
          ? { ...p, x: Math.max(5, Math.min(85, x)), y: Math.max(5, Math.min(85, y)) }
          : p
      )
    );
    setDraggedProduct(null);
    setIsAiLayout(false);
  };

  const applyAiSuggestion = () => {
    setProducts(aiSuggestedLayout);
    setIsAiLayout(true);
  };

  const resetLayout = () => {
    setProducts(initialProducts);
    setIsAiLayout(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">매장 레이아웃</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetLayout}>
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              <Button size="sm" onClick={applyAiSuggestion}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 제안
              </Button>
            </div>
          </div>

          <div
            className="relative w-full aspect-square glass rounded-xl border-2 border-dashed border-border overflow-hidden"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="absolute top-2 left-2 text-xs text-muted-foreground">입구</div>
                {products.map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={() => handleDragStart(product.id)}
                    onDragEnd={() => setDraggedProduct(null)}
                    className={`absolute w-20 h-20 ${
                      product.category === "아우터" ? "bg-primary" : 
                      product.category === "상의" ? "bg-blue-500" :
                      product.category === "하의" ? "bg-purple-500" :
                      product.category === "신발" ? "bg-amber-500" :
                      "bg-green-500"
                    } 
                      rounded-lg flex items-center justify-center text-xs font-medium text-white cursor-move transition-all hover:scale-105 hover:shadow-lg`}
                    style={{
                      left: `${(product.x / 100) * 100}%`,
                      top: `${(product.y / 100) * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {product.name}
                  </div>
                ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 ${
                  product.category === "아우터" ? "bg-primary" : 
                  product.category === "상의" ? "bg-blue-500" :
                  product.category === "하의" ? "bg-purple-500" :
                  product.category === "신발" ? "bg-amber-500" :
                  "bg-green-500"
                } rounded`} />
                <span className="text-sm">{product.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">예측 지표</h4>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">전환율</div>
              <div className="text-2xl font-bold">{metrics.conversion.toFixed(1)}%</div>
              {isAiLayout && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{(aiMetrics.conversion - metrics.conversion).toFixed(1)}%
                </Badge>
              )}
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">일 방문자</div>
              <div className="text-2xl font-bold">{Math.round(metrics.traffic)}</div>
              {isAiLayout && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.round(aiMetrics.traffic - metrics.traffic)}
                </Badge>
              )}
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">평균 체류(초)</div>
              <div className="text-2xl font-bold">{Math.round(metrics.dwell)}</div>
              {isAiLayout && (
                <Badge variant="secondary" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.round(aiMetrics.dwell - metrics.dwell)}
                </Badge>
              )}
            </Card>

            <Card className="glass p-4">
              <div className="text-sm text-muted-foreground mb-1">예상 증가 매출</div>
              <div className="text-2xl font-bold">
                {isAiLayout ? "+12.5%" : "0%"}
              </div>
            </Card>
          </div>

          <div className="glass p-4 rounded-xl">
            <h5 className="text-sm font-semibold mb-3">주간 전환율 예측</h5>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="hsl(var(--muted-foreground))"
                  name="현재 레이아웃"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="optimized"
                  stroke="hsl(var(--primary))"
                  name="최적화 레이아웃"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
