import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';

interface ParsedData {
  headers: string[];
  rows: any[];
  rowCount: number;
}

export function WiFiDataUploader() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [sensorFile, setSensorFile] = useState<File | null>(null);
  
  const [rawPreview, setRawPreview] = useState<ParsedData | null>(null);
  const [processedPreview, setProcessedPreview] = useState<ParsedData | null>(null);
  const [sensorPreview, setSensorPreview] = useState<ParsedData | null>(null);
  
  const [uploading, setUploading] = useState(false);

  // CSV 파싱 함수
  const parseCSV = (text: string): ParsedData => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    
    for (let i = 1; i < Math.min(lines.length, 11); i++) { // 최대 10개 행만 미리보기
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return {
      headers,
      rows,
      rowCount: lines.length - 1
    };
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (
    file: File,
    type: 'raw' | 'processed' | 'sensor'
  ) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      
      if (type === 'raw') {
        setRawFile(file);
        setRawPreview(parsed);
      } else if (type === 'processed') {
        setProcessedFile(file);
        setProcessedPreview(parsed);
      } else {
        setSensorFile(file);
        setSensorPreview(parsed);
      }
      
      toast.success(`${file.name} 파일 로드 완료`);
    } catch (error) {
      toast.error('파일 읽기 실패');
      console.error(error);
    }
  };

  // Storage에 업로드
  const uploadToStorage = async () => {
    if (!user || !selectedStore) {
      toast.error('매장을 선택해주세요');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = [];

      if (rawFile) {
        const rawPath = `${user.id}/${selectedStore.id}/wifi_raw_signals.csv`;
        uploadPromises.push(
          supabase.storage
            .from('store-data')
            .upload(rawPath, rawFile, { upsert: true })
        );
      }

      if (processedFile) {
        const processedPath = `${user.id}/${selectedStore.id}/wifi_tracking.csv`;
        uploadPromises.push(
          supabase.storage
            .from('store-data')
            .upload(processedPath, processedFile, { upsert: true })
        );
      }

      if (sensorFile) {
        const sensorPath = `${user.id}/${selectedStore.id}/wifi_sensors.csv`;
        uploadPromises.push(
          supabase.storage
            .from('store-data')
            .upload(sensorPath, sensorFile, { upsert: true })
        );
      }

      await Promise.all(uploadPromises);
      
      // DB에 임포트 기록 저장
      const dbInserts = [];
      
      if (rawFile) {
        dbInserts.push({
          user_id: user.id,
          store_id: selectedStore.id,
          file_name: 'wifi_raw_signals.csv',
          file_type: 'csv',
          data_type: 'wifi_raw',
          raw_data: rawPreview?.rows || [],
          row_count: rawPreview?.rowCount || 0,
        });
      }
      
      if (processedFile) {
        dbInserts.push({
          user_id: user.id,
          store_id: selectedStore.id,
          file_name: 'wifi_tracking.csv',
          file_type: 'csv',
          data_type: 'wifi_tracking',
          raw_data: processedPreview?.rows || [],
          row_count: processedPreview?.rowCount || 0,
        });
      }
      
      if (sensorFile) {
        dbInserts.push({
          user_id: user.id,
          store_id: selectedStore.id,
          file_name: 'wifi_sensors.csv',
          file_type: 'csv',
          data_type: 'wifi_sensors',
          raw_data: sensorPreview?.rows || [],
          row_count: sensorPreview?.rowCount || 0,
        });
      }
      
      if (dbInserts.length > 0) {
        const { error: dbError } = await supabase
          .from('user_data_imports')
          .insert(dbInserts);
        
        if (dbError) {
          console.error('DB insert error:', dbError);
        }
      }
      
      toast.success('모든 파일 업로드 완료!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류 발생');
    } finally {
      setUploading(false);
    }
  };

  // 데이터 검증
  const validateData = () => {
    const issues: string[] = [];

    // Raw 데이터 검증
    if (rawPreview) {
      const required = ['timestamp', 'mac_address', 'sensor_id', 'rssi'];
      const missing = required.filter(col => !rawPreview.headers.includes(col));
      if (missing.length > 0) {
        issues.push(`Raw 데이터에 필수 컬럼 누락: ${missing.join(', ')}`);
      }
    }

    // Processed 데이터 검증
    if (processedPreview) {
      const required = ['timestamp', 'mac_address', 'x', 'z'];
      const missing = required.filter(col => !processedPreview.headers.includes(col));
      if (missing.length > 0) {
        issues.push(`Processed 데이터에 필수 컬럼 누락: ${missing.join(', ')}`);
      }
    }

    // 센서 데이터 검증
    if (sensorPreview) {
      const required = ['sensor_id', 'x', 'y', 'z'];
      const missing = required.filter(col => !sensorPreview.headers.includes(col));
      if (missing.length > 0) {
        issues.push(`센서 데이터에 필수 컬럼 누락: ${missing.join(', ')}`);
      }
    }

    return issues;
  };

  const validationIssues = validateData();
  const canUpload = (rawFile || processedFile) && sensorFile && validationIssues.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WiFi 트래킹 데이터 업로드</CardTitle>
          <CardDescription>
            라즈베리파이에서 수집한 WiFi probe request 데이터를 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Raw Data 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="raw-file">
              1. Raw RSSI 데이터 (선택)
              <span className="text-sm text-muted-foreground ml-2">
                - timestamp, mac_address, sensor_id, rssi
              </span>
            </Label>
            <Input
              id="raw-file"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'raw');
              }}
            />
            {rawFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {rawFile.name} ({rawPreview?.rowCount}행)
              </div>
            )}
          </div>

          {/* Processed Data 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="processed-file">
              2. 위치 추정 데이터 (권장)
              <span className="text-sm text-muted-foreground ml-2">
                - timestamp, mac_address, x, z, accuracy
              </span>
            </Label>
            <Input
              id="processed-file"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'processed');
              }}
            />
            {processedFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {processedFile.name} ({processedPreview?.rowCount}행)
              </div>
            )}
          </div>

          {/* Sensor Data 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="sensor-file">
              3. 센서 위치 정보 (필수)
              <span className="text-sm text-muted-foreground ml-2">
                - sensor_id, x, y, z, coverage_radius
              </span>
            </Label>
            <Input
              id="sensor-file"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'sensor');
              }}
            />
            {sensorFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {sensorFile.name} ({sensorPreview?.rowCount}개 센서)
              </div>
            )}
          </div>

          {/* 검증 결과 */}
          {validationIssues.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">데이터 검증 실패:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationIssues.map((issue, i) => (
                    <li key={i} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 업로드 버튼 */}
          <Button
            onClick={uploadToStorage}
            disabled={!canUpload || uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? '업로드 중...' : 'Storage에 업로드'}
          </Button>
        </CardContent>
      </Card>

      {/* 데이터 미리보기 */}
      {(rawPreview || processedPreview || sensorPreview) && (
        <Card>
          <CardHeader>
            <CardTitle>데이터 미리보기</CardTitle>
            <CardDescription>업로드할 데이터의 처음 10행</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={processedPreview ? 'processed' : rawPreview ? 'raw' : 'sensor'}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="raw" disabled={!rawPreview}>
                  Raw RSSI
                </TabsTrigger>
                <TabsTrigger value="processed" disabled={!processedPreview}>
                  위치 데이터
                </TabsTrigger>
                <TabsTrigger value="sensor" disabled={!sensorPreview}>
                  센서
                </TabsTrigger>
              </TabsList>

              {rawPreview && (
                <TabsContent value="raw">
                  <DataPreviewTable data={rawPreview} />
                </TabsContent>
              )}

              {processedPreview && (
                <TabsContent value="processed">
                  <DataPreviewTable data={processedPreview} />
                </TabsContent>
              )}

              {sensorPreview && (
                <TabsContent value="sensor">
                  <DataPreviewTable data={sensorPreview} />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DataPreviewTable({ data }: { data: ParsedData }) {
  return (
    <div className="border rounded-lg overflow-auto max-h-96">
      <Table>
        <TableHeader>
          <TableRow>
            {data.headers.map(header => (
              <TableHead key={header} className="font-semibold">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row, i) => (
            <TableRow key={i}>
              {data.headers.map(header => (
                <TableCell key={header} className="font-mono text-xs">
                  {row[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.rowCount > 10 && (
        <div className="p-3 text-sm text-muted-foreground text-center border-t">
          ... 외 {data.rowCount - 10}행 더 있음
        </div>
      )}
    </div>
  );
}
