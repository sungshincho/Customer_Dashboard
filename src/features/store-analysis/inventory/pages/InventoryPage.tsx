import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Package, Store, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { loadStoreFile } from "@/utils/storageDataLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Inventory = () => {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 매장별 상품 데이터 로드
  useEffect(() => {
    if (selectedStore && user) {
      setLoading(true);
      loadStoreFile(user.id, selectedStore.id, 'products.csv')
        .then(data => {
          console.log(`${selectedStore.store_name} 재고 데이터:`, data.length, '개');
          // 재고 상태 계산
          const productsWithStock = data.map((p: any, idx: number) => ({
            id: idx + 1,
            name: p.name || p.product_name,
            sku: p.sku || `SKU-${String(idx + 1).padStart(3, '0')}`,
            stock: Math.floor(Math.random() * 100),
            minStock: 20 + Math.floor(Math.random() * 30),
            status: '',
            store: selectedStore.store_name
          })).map((p: any) => ({
            ...p,
            status: p.stock < 10 ? '긴급' : p.stock < p.minStock ? '부족' : '정상'
          }));
          setProductsData(productsWithStock);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load products:', error);
          setProductsData([]);
          setLoading(false);
        });
    }
  }, [selectedStore, user]);

  const lowStockCount = productsData.filter(item => item.status === "부족" || item.status === "긴급").length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!selectedStore && (
          <Alert>
            <Store className="h-4 w-4" />
            <AlertDescription>
              매장을 선택하면 해당 매장의 재고 데이터를 확인할 수 있습니다.
            </AlertDescription>
          </Alert>
        )}

        {selectedStore && (
          <>
            <div className="flex items-center justify-between animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold gradient-text">재고 관리</h1>
                <p className="mt-2 text-muted-foreground">
                  {selectedStore.store_name} - 상품: {productsData.length}개
                </p>
              </div>
              <Button className="bg-gradient-primary hover:shadow-glow">발주 요청</Button>
            </div>

        {/* Alert Banner */}
        {lowStockCount > 0 && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">재고 부족 경고</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockCount}개 품목의 재고가 부족합니다. 발주가 필요합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="상품명 또는 SKU로 검색..." className="pl-10" />
          </div>
          <Button variant="outline">필터</Button>
        </div>

        {/* Inventory Table */}
        <Card className="hover-lift animate-slide-up">
          <CardHeader>
            <CardTitle>재고 목록</CardTitle>
            <CardDescription>전체 매장 재고 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품명</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>매장</TableHead>
                  <TableHead className="text-right">재고</TableHead>
                  <TableHead className="text-right">최소재고</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>{item.store}</TableCell>
                    <TableCell className="text-right">{item.stock}</TableCell>
                    <TableCell className="text-right">{item.minStock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "긴급"
                            ? "destructive"
                            : item.status === "부족"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">총 품목</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{productsData.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">정상 재고</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-500" />
                <span className="text-2xl font-bold">
                  {productsData.filter(item => item.status === "정상").length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">재고 부족</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-2xl font-bold text-destructive">{lowStockCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
