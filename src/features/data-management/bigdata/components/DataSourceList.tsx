import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, RefreshCw } from "lucide-react";

interface DataSource {
  id: string;
  name: string;
  source_type: string;
  api_url: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface DataSourceListProps {
  onEdit?: (source: DataSource) => void;
  refresh?: number;
}

export function DataSourceList({ onEdit, refresh }: DataSourceListProps) {
  const { toast } = useToast();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from("external_data_sources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error: any) {
      toast({
        title: "데이터 소스 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 데이터 소스를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("external_data_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "데이터 소스가 삭제되었습니다." });
      fetchSources();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("external_data_sources")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ title: currentStatus ? "비활성화되었습니다" : "활성화되었습니다" });
      fetchSources();
    } catch (error: any) {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      weather: "날씨",
      demographics: "인구통계",
      economic: "경제",
      social: "소셜",
      custom: "커스텀",
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {sources.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 데이터 소스가 없습니다
          </CardContent>
        </Card>
      ) : (
        sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                  <CardDescription>{source.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={source.is_active ? "default" : "secondary"}>
                    {source.is_active ? "활성" : "비활성"}
                  </Badge>
                  <Badge variant="outline">{getSourceTypeLabel(source.source_type)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>API URL:</strong> {source.api_url || "N/A"}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(source.id, source.is_active)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {source.is_active ? "비활성화" : "활성화"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit?.(source)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(source.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
