import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet, Trash2, Download, Link2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { detectDataType } from "@/utils/dataNormalizer";
import * as XLSX from "xlsx";

interface ImportedData {
  id: string;
  file_name: string;
  file_type: string;
  data_type: string;
  row_count: number;
  created_at: string;
  raw_data: any;
  sheet_name?: string;
}

const DataImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [imports, setImports] = useState<ImportedData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>("");
  const [apiMethod, setApiMethod] = useState<string>("GET");
  const [apiHeaders, setApiHeaders] = useState<string>("");
  const [apiBody, setApiBody] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [sheetAnalysis, setSheetAnalysis] = useState<any[]>([]);
  const [showSheetReview, setShowSheetReview] = useState(false);
  const { toast } = useToast();

  const loadImports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
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
      const supportedTypes = ["csv", "xlsx", "xls", "json", "jsonl", "xml", "pdf", "jpg", "jpeg", "png"];
      if (supportedTypes.includes(fileType || "")) {
        setFile(selectedFile);
      } else {
        toast({
          title: "지원하지 않는 파일 형식",
          description: "지원 형식: CSV, XLSX, JSON, JSONL, XML, PDF, JPEG, PNG",
          variant: "destructive",
        });
      }
    }
  };

  const parseFile = async (file: File): Promise<{sheets: {name: string, data: any[]}[]} | any[]> => {
    const fileType = file.name.split(".").pop()?.toLowerCase();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          
          if (fileType === "csv" || fileType === "xlsx" || fileType === "xls") {
            const workbook = XLSX.read(data, { type: "binary" });
            
            // 각 시트를 개별적으로 파싱
            const sheets = workbook.SheetNames.map((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
              return {
                name: sheetName,
                data: jsonData
              };
            }).filter(sheet => sheet.data.length > 0); // 빈 시트 제외
            
            // 시트가 여러 개면 시트별로 구분, 하나면 데이터만 반환
            if (sheets.length > 1) {
              resolve({ sheets });
            } else if (sheets.length === 1) {
              resolve(sheets[0].data);
            } else {
              resolve([]);
            }
          } else if (fileType === "json") {
            const jsonData = JSON.parse(data as string);
            resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
          } else if (fileType === "jsonl") {
            const lines = (data as string).trim().split("\n");
            const jsonData = lines.map(line => JSON.parse(line));
            resolve(jsonData);
          } else if (fileType === "xml") {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data as string, "text/xml");
            const items = Array.from(xmlDoc.querySelectorAll("item, record, row"));
            const jsonData = items.map(item => {
              const obj: any = {};
              Array.from(item.children).forEach(child => {
                obj[child.tagName] = child.textContent;
              });
              return obj;
            });
            resolve(jsonData.length > 0 ? jsonData : [{ raw: data }]);
          } else if (fileType === "pdf") {
            resolve([{
              file_name: file.name,
              file_type: "pdf",
              note: "PDF 파일은 텍스트 추출을 위해 서버 처리가 필요합니다.",
              size: file.size
            }]);
          } else if (fileType === "jpg" || fileType === "jpeg" || fileType === "png") {
            resolve([{
              file_name: file.name,
              file_type: fileType,
              note: "이미지 파일이 업로드되었습니다. OCR은 추후 처리됩니다.",
              size: file.size,
              lastModified: file.lastModified
            }]);
          } else {
            reject(new Error("지원하지 않는 파일 형식"));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      
      if (fileType === "json" || fileType === "jsonl" || fileType === "xml") {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const confirmAndUploadSheets = async () => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // 학습 패턴 저장
      const { learnFromCorrection } = await import('@/utils/classificationLearning');
      for (const sheet of sheetAnalysis) {
        const columns = sheet.data.length > 0 ? Object.keys(sheet.data[0]) : [];
        await learnFromCorrection(sheet.name, columns, sheet.detectedType);
      }

      // DB에 저장
      const inserts = sheetAnalysis.map((sheet: any) => ({
        user_id: user.id,
        file_name: file!.name,
        file_type: file!.name.split(".").pop() || "unknown",
        data_type: sheet.detectedType,
        raw_data: sheet.data,
        row_count: sheet.data.length,
        sheet_name: sheet.name,
      }));

      const { error } = await (supabase as any).from("user_data_imports").insert(inserts);

      if (error) throw error;

      const totalRows = sheetAnalysis.reduce((sum, sheet) => sum + sheet.data.length, 0);
      toast({
        title: "업로드 완료",
        description: `${sheetAnalysis.length}개 시트, 총 ${totalRows}개의 데이터가 성공적으로 임포트되었습니다.`,
      });

      // 초기화
      setFile(null);
      setDataType("");
      setSheetAnalysis([]);
      setShowSheetReview(false);
      const fileInput = document.getElementById("file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      loadImports();
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    console.log("🔵 Upload button clicked", { file, dataType });
    
    // 엑셀 파일은 dataType 체크 건너뛰기 (자동 감지)
    const isExcelFile = file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));
    
    if (!file || (!isExcelFile && !dataType)) {
      console.log("❌ Missing file or dataType");
      toast({
        title: "입력 필요",
        description: isExcelFile ? "파일을 선택해주세요." : "파일과 데이터 타입을 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Starting upload process");
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      console.log("📦 Parsing file...");
      const parsedData = await parseFile(file);
      console.log("✅ File parsed:", parsedData);
      
      // 여러 시트가 있는 경우 각 시트를 개별 레코드로 저장
      if (parsedData && typeof parsedData === 'object' && 'sheets' in parsedData) {
        const sheets = parsedData.sheets as {name: string, data: any[]}[];
        
        // 시트별 자동 분류 분석
        const analysisResults = await Promise.all(
          sheets.map(async (sheet) => {
            const columns = sheet.data.length > 0 ? Object.keys(sheet.data[0]) : [];
            const { detectDataTypeWithLearning } = await import('@/utils/classificationLearning');
            const result = await detectDataTypeWithLearning(sheet.name, columns);
            
            console.log(`📊 시트 "${sheet.name}" 분석 완료:`, result);
            
            return {
              ...sheet,
              detectedType: result.type,
              confidence: result.confidence,
              source: result.source
            };
          })
        );
        
        setSheetAnalysis(analysisResults);
        setShowSheetReview(true);
        
        toast({
          title: "시트 분석 완료",
          description: `${sheets.length}개 시트의 데이터 타입이 자동 분석되었습니다. 검토 후 업로드하세요.`,
        });
      } else {
        // 단일 시트 또는 CSV
        const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        const { error } = await (supabase as any).from("user_data_imports").insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.name.split(".").pop() || "unknown",
          data_type: dataType,
          raw_data: dataArray,
          row_count: dataArray.length,
        });

        if (error) {
          console.error("❌ Database error:", error);
          throw error;
        }

        toast({
          title: "업로드 완료",
          description: `${dataArray.length}개의 데이터가 성공적으로 임포트되었습니다.`,
        });
      }

      console.log("✅ Upload completed successfully");
      setFile(null);
      setDataType("");
      
      // Reset file input
      const fileInput = document.getElementById("file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      loadImports();
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log("🔵 Upload process finished");
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
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

  const handleApiConnect = async () => {
    if (!apiUrl || !dataType) {
      toast({
        title: "입력 필요",
        description: "API URL과 데이터 타입을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const headers: any = {};
      if (apiHeaders) {
        const headerLines = apiHeaders.split("\n");
        headerLines.forEach(line => {
          const [key, value] = line.split(":").map(s => s.trim());
          if (key && value) headers[key] = value;
        });
      }

      const requestOptions: RequestInit = {
        method: apiMethod,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (apiMethod !== "GET" && apiBody) {
        requestOptions.body = apiBody;
      }

      const response = await fetch(apiUrl, requestOptions);
      if (!response.ok) throw new Error(`API 오류: ${response.statusText}`);
      
      const apiData = await response.json();
      const dataArray = Array.isArray(apiData) ? apiData : [apiData];

      const { error } = await (supabase as any).from("user_data_imports").insert({
        user_id: user.id,
        file_name: `API_${new Date().toISOString()}`,
        file_type: "api",
        data_type: dataType,
        raw_data: dataArray,
        row_count: dataArray.length,
      });

      if (error) throw error;

      toast({
        title: "연결 완료",
        description: `${dataArray.length}개의 데이터를 API에서 가져왔습니다.`,
      });

      setApiUrl("");
      setApiHeaders("");
      setApiBody("");
      loadImports();
    } catch (error: any) {
      toast({
        title: "API 연결 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExport = (importData: ImportedData) => {
    const worksheet = XLSX.utils.json_to_sheet(importData.raw_data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `export_${importData.file_name}`);
  };

  useEffect(() => {
    loadImports();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">데이터 임포트</h1>
          <p className="text-muted-foreground mt-2">
            자사 데이터를 업로드하여 분석에 활용하세요
          </p>
        </div>

        <Tabs defaultValue="file" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <Upload className="mr-2 h-4 w-4" />
              파일 업로드
            </TabsTrigger>
            <TabsTrigger value="api">
              <Link2 className="mr-2 h-4 w-4" />
              API 연결
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle>파일 업로드</CardTitle>
                <CardDescription>
                  다양한 형식의 데이터 파일을 업로드하세요 (최대 20MB)
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">CSV</Badge>
                  <Badge variant="outline">XLSX</Badge>
                  <Badge variant="outline">JSON</Badge>
                  <Badge variant="outline">JSONL</Badge>
                  <Badge variant="outline">XML</Badge>
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">JPEG</Badge>
                  <Badge variant="outline">PNG</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dataType">데이터 유형</Label>
                  {file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        📊 엑셀 파일의 각 시트는 자동으로 데이터 타입이 분석됩니다
                      </p>
                    </div>
                  ) : (
                    <Select value={dataType} onValueChange={setDataType}>
                      <SelectTrigger>
                        <SelectValue placeholder="데이터 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="traffic_sensor">센서(동선) 데이터</SelectItem>
                        <SelectItem value="customer">고객(회원정보) 데이터</SelectItem>
                        <SelectItem value="brand">브랜드 데이터</SelectItem>
                        <SelectItem value="product">제품 데이터</SelectItem>
                        <SelectItem value="store">매장 데이터</SelectItem>
                        <SelectItem value="sales">매출 데이터</SelectItem>
                        <SelectItem value="other">기타 데이터</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">파일 선택</Label>
                  <div className="flex gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.xlsx,.xls,.json,.jsonl,.xml,.pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={
                        !file || 
                        isUploading || 
                        (!file?.name.match(/\.(xlsx|xls)$/i) && !dataType)
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "업로드 중..." : "업로드"}
                    </Button>
                  </div>
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      선택된 파일: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 시트 검토 UI */}
            {showSheetReview && sheetAnalysis.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>시트 분석 결과</span>
                    <Badge variant="secondary">
                      AI 학습 활성화 🧠
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    각 시트의 자동 분류 결과를 확인하고 수정하세요. 수정한 내용은 다음 업로드 시 반영됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sheetAnalysis.map((sheet: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{sheet.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {sheet.data.length.toLocaleString()}개 레코드
                          </p>
                          {sheet.source === 'learned' && (
                            <Badge variant="default" className="mt-2 text-xs">
                              학습된 패턴 사용 ({(sheet.confidence * 100).toFixed(0)}% 신뢰도)
                            </Badge>
                          )}
                          {sheet.source === 'default' && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              기본 감지 ({(sheet.confidence * 100).toFixed(0)}% 신뢰도)
                            </Badge>
                          )}
                        </div>
                        <div className="w-48">
                          <Select 
                            value={sheet.detectedType} 
                            onValueChange={(value) => {
                              const updated = [...sheetAnalysis];
                              updated[idx].detectedType = value;
                              setSheetAnalysis(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="traffic_sensor">센서(동선) 데이터</SelectItem>
                              <SelectItem value="customer">고객(회원정보) 데이터</SelectItem>
                              <SelectItem value="brand">브랜드 데이터</SelectItem>
                              <SelectItem value="product">제품 데이터</SelectItem>
                              <SelectItem value="store">매장 데이터</SelectItem>
                              <SelectItem value="sales">매출 데이터</SelectItem>
                              <SelectItem value="other">기타 데이터</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        주요 컬럼: {sheet.data.length > 0 ? Object.keys(sheet.data[0]).slice(0, 5).join(', ') : '없음'}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSheetReview(false);
                        setSheetAnalysis([]);
                        setFile(null);
                        const fileInput = document.getElementById("file") as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={confirmAndUploadSheets}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? "업로드 중..." : "확인 및 업로드"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API 연결</CardTitle>
                <CardDescription>
                  REST API 엔드포인트에 연결하여 데이터를 가져오세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiDataType">데이터 유형</Label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger>
                      <SelectValue placeholder="데이터 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traffic_sensor">센서(동선) 데이터</SelectItem>
                      <SelectItem value="customer">고객(회원정보) 데이터</SelectItem>
                      <SelectItem value="brand">브랜드 데이터</SelectItem>
                      <SelectItem value="product">제품 데이터</SelectItem>
                      <SelectItem value="store">매장 데이터</SelectItem>
                      <SelectItem value="sales">매출 데이터</SelectItem>
                      <SelectItem value="other">기타 데이터</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    type="url"
                    placeholder="https://api.example.com/data"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    disabled={isConnecting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiMethod">HTTP Method</Label>
                  <Select value={apiMethod} onValueChange={setApiMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiHeaders">헤더 (선택사항)</Label>
                  <Textarea
                    id="apiHeaders"
                    placeholder="Authorization: Bearer token&#10;Content-Type: application/json"
                    value={apiHeaders}
                    onChange={(e) => setApiHeaders(e.target.value)}
                    disabled={isConnecting}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    각 헤더를 새 줄에 작성하세요 (예: Key: Value)
                  </p>
                </div>

                {apiMethod !== "GET" && (
                  <div className="space-y-2">
                    <Label htmlFor="apiBody">Request Body (JSON)</Label>
                    <Textarea
                      id="apiBody"
                      placeholder='{"key": "value"}'
                      value={apiBody}
                      onChange={(e) => setApiBody(e.target.value)}
                      disabled={isConnecting}
                      rows={4}
                    />
                  </div>
                )}

                <Button
                  onClick={handleApiConnect}
                  disabled={!apiUrl || !dataType || isConnecting}
                  className="w-full"
                >
                  <Database className="mr-2 h-4 w-4" />
                  {isConnecting ? "연결 중..." : "데이터 가져오기"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                    <TableHead>시트명</TableHead>
                    <TableHead>데이터 유형</TableHead>
                    <TableHead>행 수</TableHead>
                    <TableHead>업로드 일시</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.file_name}
                        {item.file_type === "api" && (
                          <Badge variant="outline" className="ml-2">API</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.sheet_name ? (
                          <Badge variant="outline">{item.sheet_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.data_type === "sales" && "매출"}
                          {item.data_type === "customer" && "고객"}
                          {item.data_type === "inventory" && "재고"}
                          {item.data_type === "traffic" && "유동인구"}
                          {item.data_type === "staff" && "직원"}
                          {item.data_type === "product" && "상품"}
                          {item.data_type === "transaction" && "거래"}
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
