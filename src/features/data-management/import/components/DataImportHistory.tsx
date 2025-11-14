import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataImportHistoryProps {
  storeId?: string;
}

interface ImportRecord {
  id: string;
  file_name: string;
  file_type: string;
  data_type: string;
  row_count: number;
  created_at: string;
  raw_data: any;
}

export function DataImportHistory({ storeId }: DataImportHistoryProps) {
  const { toast } = useToast();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadImports();
  }, [storeId]);

  const loadImports = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('user_data_imports')
        .select('*');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "데이터 불러오기 실패: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_data_imports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "데이터가 삭제되었습니다",
      });

      loadImports();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (record: ImportRecord) => {
    const dataStr = JSON.stringify(record.raw_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.file_name}_${record.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = (record: ImportRecord) => {
    setSelectedImport(record);
    setShowPreview(true);
  };

  const getDataTypeBadge = (dataType: string) => {
    const colors: Record<string, string> = {
      visits: "bg-blue-100 text-blue-800",
      purchases: "bg-green-100 text-green-800",
      products: "bg-purple-100 text-purple-800",
      customers: "bg-yellow-100 text-yellow-800",
      inventory: "bg-orange-100 text-orange-800",
      stores: "bg-pink-100 text-pink-800",
    };

    return (
      <Badge className={colors[dataType] || "bg-gray-100 text-gray-800"}>
        {dataType}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>데이터 임포트 히스토리</CardTitle>
          <CardDescription>
            업로드된 모든 데이터의 기록을 확인하고 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : imports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>아직 업로드된 데이터가 없습니다</p>
              <p className="text-sm mt-2">다른 탭에서 데이터를 업로드해보세요</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>파일명</TableHead>
                    <TableHead>데이터 타입</TableHead>
                    <TableHead>행 수</TableHead>
                    <TableHead>업로드 일시</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.file_name}
                        <span className="text-xs text-muted-foreground ml-2">
                          (.{record.file_type})
                        </span>
                      </TableCell>
                      <TableCell>
                        {getDataTypeBadge(record.data_type)}
                      </TableCell>
                      <TableCell>{record.row_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(record)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(record)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 데이터 프리뷰 다이얼로그 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>데이터 미리보기</DialogTitle>
          </DialogHeader>
          {selectedImport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">파일명:</span> {selectedImport.file_name}
                </div>
                <div>
                  <span className="font-semibold">데이터 타입:</span> {selectedImport.data_type}
                </div>
                <div>
                  <span className="font-semibold">행 수:</span> {selectedImport.row_count}
                </div>
                <div>
                  <span className="font-semibold">업로드 일시:</span>{' '}
                  {format(new Date(selectedImport.created_at), 'yyyy-MM-dd HH:mm')}
                </div>
              </div>

              <ScrollArea className="h-[50vh] rounded-md border p-4">
                <pre className="text-xs">
                  {JSON.stringify(selectedImport.raw_data, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
