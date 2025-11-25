import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedMessageThread } from "../components/UnifiedMessageThread";
import { GuidelineList } from "../components/GuidelineList";
import { GuidelineForm } from "../components/GuidelineForm";
import { NotificationPanel } from "../components/NotificationPanel";
import { MessageSquare, FileText, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HQCommunicationPage = () => {
  const { isOrgHQ } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">HQ-매장 커뮤니케이션</h1>
          <p className="mt-2 text-muted-foreground">
            본사와 매장 간 실시간 소통 및 가이드라인 관리
          </p>
        </div>

        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              메시지 & 코멘트
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="gap-2">
              <FileText className="w-4 h-4" />
              가이드라인
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              알림
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            <UnifiedMessageThread />
          </TabsContent>

          <TabsContent value="guidelines" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GuidelineList />
              </div>
              {isOrgHQ && (
                <div>
                  <GuidelineForm />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HQCommunicationPage;
