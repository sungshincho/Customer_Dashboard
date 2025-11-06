import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface ImportedData {
  id: string;
  file_name: string;
  file_type: string;
  data_type: string;
  row_count: number;
  created_at: string;
  raw_data: any;
}

const DataImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [imports, setImports] = useState<ImportedData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadImports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_data_imports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "데이터 불러오기 실패: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileType === "csv" || fileType === "xlsx" || fileType === "xls") {
        setFile(selectedFile);
      } else {
        toast({
          title: "지원하지 않는 파일 형식",
          description: "CSV 또는 Excel 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!file || !dataType) {
      toast({
        title: "입력 필요",
        description: "파일과 데이터 타입을 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const parsedData = await parseFile(file);
      
      const { error } = await supabase.from("user_data_imports").insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.name.split(".").pop() || "unknown",
        data_type: dataType,
        raw_data: parsedData,
        row_count: parsedData.length,
      });

      if (error) throw error;

      toast({
        title: "업로드 완료",
        description: `${parsedData.length}개의 데이터가 성공적으로 임포트되었습니다.`,
      });

      setFile(null);
      setDataType("");
      loadImports();
    } catch (error: any) {
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_data_imports")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "데이터가 삭제되었습니다.",
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

  const handleExport = (importData: ImportedData) => {
    const worksheet = XLSX.utils.json_to_sheet(importData.raw_data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `export_${importData.file_name}`);
  };

  useState(() => {
    loadImports();
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">데이터 임포트</h1>
          <p className="text-muted-foreground mt-2">
            자사 데이터를 업로드하여 분석에 활용하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>파일 업로드</CardTitle>
            <CardDescription>
              CSV 또는 Excel 파일을 업로드하세요 (최대 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dataType">데이터 유형</Label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="데이터 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">매출 데이터</SelectItem>
                  <SelectItem value="customer">고객 데이터</SelectItem>
                  <SelectItem value="inventory">재고 데이터</SelectItem>
                  <SelectItem value="traffic">유동인구 데이터</SelectItem>
                  <SelectItem value="staff">직원 데이터</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">파일 선택</Label>
              <div className="flex gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button
                  onClick={handleUpload}
                  disabled={!file || !dataType || isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "업로드 중..." : "업로드"}
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  선택된 파일: {file.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>임포트 히스토리</CardTitle>
            <CardDescription>업로드한 데이터 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">로딩 중...</p>
            ) : imports.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  아직 임포트한 데이터가 없습니다
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>파일명</TableHead>
                    <TableHead>데이터 유형</TableHead>
                    <TableHead>행 수</TableHead>
                    <TableHead>업로드 일시</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.data_type === "sales" && "매출"}
                          {item.data_type === "customer" && "고객"}
                          {item.data_type === "inventory" && "재고"}
                          {item.data_type === "traffic" && "유동인구"}
                          {item.data_type === "staff" && "직원"}
                          {item.data_type === "other" && "기타"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.row_count.toLocaleString()}개</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExport(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DataImport;
