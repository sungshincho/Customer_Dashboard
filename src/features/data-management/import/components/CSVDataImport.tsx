import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, Link2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { detectDataType } from "@/utils/dataNormalizer";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface CSVDataImportProps {
  storeId?: string;
}

export function CSVDataImport({ storeId }: CSVDataImportProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  
  // API 연동
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiHeaders, setApiHeaders] = useState("");
  const [apiBody, setApiBody] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      const supportedTypes = ["csv", "xlsx", "xls", "json"];
      
      if (supportedTypes.includes(fileType || "")) {
        setFile(selectedFile);
      } else {
        toast({
          title: "지원하지 않는 파일 형식",
          description: "지원 형식: CSV, XLSX, JSON",
          variant: "destructive",
        });
      }
    }
  };

  const parseFile = async (file: File): Promise<any[]> => {
    const fileType = file.name.split(".").pop()?.toLowerCase();
    
    if (fileType === "csv") {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      
      return lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.trim();
        });
        return obj;
      });
    } else if (fileType === "xlsx" || fileType === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } else if (fileType === "json") {
      const text = await file.text();
      return JSON.parse(text);
    }
    
    return [];
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "파일을 선택하세요",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const parsedData = await parseFile(file);
      
      if (parsedData.length === 0) {
        throw new Error("파일에 데이터가 없습니다");
      }

      // 데이터 타입 자동 감지
      const detectedType = dataType || detectDataType(parsedData[0]);

      const { error } = await supabase
        .from("user_data_imports")
        .insert({
          user_id: user.id,
          store_id: storeId,
          file_name: file.name,
          file_type: file.name.split(".").pop(),
          data_type: detectedType,
          raw_data: parsedData,
          row_count: parsedData.length,
        });

      if (error) throw error;

      toast({
        title: "업로드 성공",
        description: `${parsedData.length}개 행이 업로드되었습니다`,
      });

      setFile(null);
      setDataType("");
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

  const handleAPIConnect = async () => {
    if (!apiUrl) {
      toast({
        title: "API URL을 입력하세요",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const headers: Record<string, string> = {};
      if (apiHeaders) {
        apiHeaders.split("\n").forEach(line => {
          const [key, value] = line.split(":").map(s => s.trim());
          if (key && value) headers[key] = value;
        });
      }

      const options: RequestInit = {
        method: apiMethod,
        headers,
      };

      if (apiMethod !== "GET" && apiBody) {
        options.body = apiBody;
      }

      const response = await fetch(apiUrl, options);
      const data = await response.json();

      const dataArray = Array.isArray(data) ? data : [data];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_data_imports")
        .insert({
          user_id: user.id,
          store_id: storeId,
          file_name: `API: ${apiUrl}`,
          file_type: "api",
          data_type: dataType || "api_data",
          raw_data: dataArray,
          row_count: dataArray.length,
        });

      if (error) throw error;

      toast({
        title: "API 연결 성공",
        description: `${dataArray.length}개 레코드가 임포트되었습니다`,
      });

      setApiUrl("");
      setApiBody("");
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV/Excel 데이터 임포트</CardTitle>
          <CardDescription>
            매출, 방문, 고객, 제품 등의 데이터를 CSV 또는 Excel 파일로 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file" className="space-y-4">
            <TabsList>
              <TabsTrigger value="file">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                파일 업로드
              </TabsTrigger>
              <TabsTrigger value="api">
                <Link2 className="w-4 h-4 mr-2" />
                API 연동
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="data-type">데이터 타입 (선택)</Label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger id="data-type">
                      <SelectValue placeholder="자동 감지 또는 직접 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visits">방문 데이터</SelectItem>
                      <SelectItem value="purchases">구매 데이터</SelectItem>
                      <SelectItem value="products">제품 데이터</SelectItem>
                      <SelectItem value="customers">고객 데이터</SelectItem>
                      <SelectItem value="inventory">재고 데이터</SelectItem>
                      <SelectItem value="stores">매장 데이터</SelectItem>
                      <SelectItem value="staff">직원 데이터</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="file-upload">파일 선택</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileChange}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      선택된 파일: {file.name}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      업로드
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-url">API URL</Label>
                  <Input
                    id="api-url"
                    placeholder="https://api.example.com/data"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="api-method">HTTP Method</Label>
                  <Select value={apiMethod} onValueChange={setApiMethod}>
                    <SelectTrigger id="api-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="api-headers">Headers (선택)</Label>
                  <Textarea
                    id="api-headers"
                    placeholder="Authorization: Bearer token&#10;Content-Type: application/json"
                    value={apiHeaders}
                    onChange={(e) => setApiHeaders(e.target.value)}
                    rows={3}
                  />
                </div>

                {apiMethod !== "GET" && (
                  <div>
                    <Label htmlFor="api-body">Request Body (JSON)</Label>
                    <Textarea
                      id="api-body"
                      placeholder='{"key": "value"}'
                      value={apiBody}
                      onChange={(e) => setApiBody(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="api-data-type">데이터 타입 (선택)</Label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger id="api-data-type">
                      <SelectValue placeholder="데이터 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_data">API 데이터</SelectItem>
                      <SelectItem value="visits">방문 데이터</SelectItem>
                      <SelectItem value="purchases">구매 데이터</SelectItem>
                      <SelectItem value="products">제품 데이터</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAPIConnect}
                  disabled={!apiUrl || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      연결 중...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      API 연결
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 데이터 포맷 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>CSV 포맷 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">방문 데이터 (visits.csv)</h4>
            <code className="text-xs bg-muted p-2 rounded block">
              visit_id,customer_id,store_id,visit_date,entry_time,exit_time,duration_minutes
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">구매 데이터 (purchases.csv)</h4>
            <code className="text-xs bg-muted p-2 rounded block">
              purchase_id,customer_id,product_id,quantity,unit_price,total_amount,purchase_datetime
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">제품 데이터 (products.csv)</h4>
            <code className="text-xs bg-muted p-2 rounded block">
              product_id,sku,name,category,cost_price,selling_price,supplier
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
