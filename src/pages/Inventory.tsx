import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const inventory = [
  { id: 1, name: "상품 A", sku: "SKU-001", stock: 5, minStock: 10, status: "부족", store: "강남점" },
  { id: 2, name: "상품 B", sku: "SKU-002", stock: 45, minStock: 20, status: "정상", store: "강남점" },
  { id: 3, name: "상품 C", sku: "SKU-003", stock: 8, minStock: 15, status: "부족", store: "홍대점" },
  { id: 4, name: "상품 D", sku: "SKU-004", stock: 120, minStock: 50, status: "정상", store: "명동점" },
  { id: 5, name: "상품 E", sku: "SKU-005", stock: 3, minStock: 10, status: "긴급", store: "홍대점" },
  { id: 6, name: "상품 F", sku: "SKU-006", stock: 67, minStock: 30, status: "정상", store: "잠실점" },
];

const Inventory = () => {
  const lowStockCount = inventory.filter(item => item.status === "부족" || item.status === "긴급").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">재고 관리</h1>
            <p className="mt-2 text-muted-foreground">전체 매장 재고 현황 및 관리</p>
          </div>
          <Button>발주 요청</Button>
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
        <Card>
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
                {inventory.map((item) => (
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
                <span className="text-2xl font-bold">{inventory.length}</span>
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
                  {inventory.filter(item => item.status === "정상").length}
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
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
