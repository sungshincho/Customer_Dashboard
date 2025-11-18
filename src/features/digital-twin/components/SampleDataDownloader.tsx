import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface SampleFile {
  name: string;
  path: string;
  description: string;
  size: string;
}

const SAMPLE_FILES: SampleFile[] = [
  {
    name: "store_a001_zones.csv",
    path: "/samples/store_a001_zones.csv",
    description: "289개 1m 그리드 zone 정의 (17.4m x 16.6m 매장)",
    size: "~50KB"
  },
  {
    name: "store_a001_wifi_tracking.csv",
    path: "/samples/store_a001_wifi_tracking.csv",
    description: "10명 고객 WiFi tracking 동선 데이터",
    size: "~15KB"
  },
  {
    name: "store_a001_wifi_sensors.csv",
    path: "/samples/store_a001_wifi_sensors.csv",
    description: "12개 WiFi 센서 위치 및 커버리지 정보",
    size: "~3KB"
  }
];

export const SampleDataDownloader = () => {
  const downloadFile = async (file: SampleFile) => {
    try {
      const response = await fetch(file.path);
      if (!response.ok) throw new Error('파일 다운로드 실패');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${file.name} 다운로드 완료`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('파일 다운로드에 실패했습니다');
    }
  };

  const downloadAll = async () => {
    toast.info('전체 파일 다운로드를 시작합니다...');
    
    for (const file of SAMPLE_FILES) {
      await downloadFile(file);
      // 다운로드 간격 조정
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    toast.success('모든 파일 다운로드 완료');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          A001 매장 샘플 데이터셋
        </CardTitle>
        <CardDescription>
          17.4m x 16.6m (288.84㎡) A001 강남매장 기준 WiFi 트래킹 데모 데이터
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {SAMPLE_FILES.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {file.description}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  크기: {file.size}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadFile(file)}
                className="ml-4"
              >
                <Download className="h-4 w-4 mr-1" />
                다운로드
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <Button
            onClick={downloadAll}
            className="w-full"
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            전체 다운로드 (3개 파일)
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p>📍 매장 정보:</p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>매장 크기: 17.4m(W) × 16.6m(D) × 3.0m(H)</li>
            <li>좌표계: 중앙(0,0) 기준, X축 좌우, Z축 전후</li>
            <li>Zone: 1m × 1m 그리드 289개 영역</li>
            <li>센서: 12개 WiFi AP (커버리지 5m~12m)</li>
            <li>고객: 10명 세션 (체류시간 8~12분)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
