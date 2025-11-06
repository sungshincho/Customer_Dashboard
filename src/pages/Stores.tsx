import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, TrendingUp, Users } from "lucide-react";

const stores = [
  {
    id: 1,
    name: "강남점",
    address: "서울특별시 강남구 테헤란로 123",
    phone: "02-1234-5678",
    status: "운영중",
    visitors: 1234,
    sales: "₩4,200,000",
    trend: "+12%",
    hours: "10:00 - 22:00",
  },
  {
    id: 2,
    name: "홍대점",
    address: "서울특별시 마포구 양화로 456",
    phone: "02-2345-6789",
    status: "운영중",
    visitors: 987,
    sales: "₩3,800,000",
    trend: "+8%",
    hours: "11:00 - 23:00",
  },
  {
    id: 3,
    name: "명동점",
    address: "서울특별시 중구 명동길 789",
    phone: "02-3456-7890",
    status: "운영중",
    visitors: 1567,
    sales: "₩5,100,000",
    trend: "+15%",
    hours: "10:00 - 22:00",
  },
  {
    id: 4,
    name: "잠실점",
    address: "서울특별시 송파구 올림픽로 321",
    phone: "02-4567-8901",
    status: "점검중",
    visitors: 0,
    sales: "₩0",
    trend: "0%",
    hours: "시스템 점검",
  },
];

const Stores = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 관리</h1>
            <p className="mt-2 text-muted-foreground">전체 매장 현황 및 관리</p>
          </div>
          <Button className="bg-gradient-primary hover:shadow-glow">새 매장 추가</Button>
        </div>

        {/* Stores Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {stores.map((store, index) => (
            <Card key={store.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{store.name}</CardTitle>
                    <CardDescription className="mt-1">{store.address}</CardDescription>
                  </div>
                  <Badge variant={store.status === "운영중" ? "default" : "secondary"}>
                    {store.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{store.hours}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>방문자</span>
                    </div>
                    <p className="mt-1 text-xl font-bold">{store.visitors.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>매출</span>
                    </div>
                    <p className="mt-1 text-lg font-bold">{store.sales}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">증감</div>
                    <p className={`mt-1 text-lg font-bold ${store.trend.startsWith('+') ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {store.trend}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 hover:bg-primary hover:text-primary-foreground transition-all">상세보기</Button>
                  <Button variant="outline" className="flex-1 hover:bg-secondary transition-all">설정</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Stores;
