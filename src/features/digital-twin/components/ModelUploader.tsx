import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, Copy, ExternalLink, Sparkles, Eye, AlertCircle } from 'lucide-react';
import { AutoModelMapper } from './AutoModelMapper';
import { Model3DPreview } from './Model3DPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadedFile {
  name: string;
  url: string;
}

interface ModelAnalysis {
  matched_entity_type: any;
  confidence: number;
  inferred_type: string;
  suggested_dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  reasoning: string;
  fileName: string;
  fileUrl: string;
}

export function ModelUploader() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pendingAnalysis, setPendingAnalysis] = useState<ModelAnalysis | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "URL이 클립보드에 복사되었습니다",
    });
  };

  const analyzeModel = async (file: UploadedFile) => {
    if (!user) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-3d-model', {
        body: {
          fileName: file.name,
          fileUrl: file.url,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setPendingAnalysis({
          ...data.analysis,
          matched_entity_type: data.matched_entity_type,
          fileName: file.name,
          fileUrl: file.url
        });
      }
    } catch (err) {
      console.error('Model analysis error:', err);
      toast({
        title: "분석 실패",
        description: "3D 모델 자동 분석에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    if (!selectedStore) {
      toast({
        title: "매장을 선택해주세요",
        description: "3D 모델을 업로드하려면 먼저 매장을 선택해야 합니다",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        // 매장별 경로: {userId}/{storeId}/3d-models/{filename}
        const fileName = `${user.id}/${selectedStore.id}/3d-models/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('3d-models')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('3d-models')
          .getPublicUrl(fileName);

        return { name: file.name, url: publicUrl };
      });

      const results = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => [...prev, ...results]);
      
      toast({
        title: "업로드 완료",
        description: `${results.length}개의 3D 모델이 업로드되었습니다.`,
      });

      // Auto-analyze the first uploaded file
      if (results.length > 0) {
        await analyzeModel(results[0]);
      }
    } catch (err) {
      console.error('업로드 실패:', err);
      toast({
        title: "업로드 실패",
        description: err instanceof Error ? err.message : "파일 업로드에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!selectedStore && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            3D 모델을 업로드하려면 먼저 사이드바에서 매장을 선택해주세요
          </AlertDescription>
        </Alert>
      )}

      {pendingAnalysis && (
        <AutoModelMapper
          analysis={pendingAnalysis}
          onAccept={() => {
            setPendingAnalysis(null);
            toast({
              title: "매핑 완료",
              description: "3D 모델이 온톨로지에 자동으로 연결되었습니다",
            });
          }}
          onReject={() => {
            setPendingAnalysis(null);
            toast({
              title: "매핑 거부",
              description: "수동으로 스키마 빌더에서 연결할 수 있습니다",
            });
          }}
        />
      )}

      {analyzing && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 animate-pulse text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">AI가 3D 모델을 분석하고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
      <CardHeader>
        <CardTitle>3D 모델 업로드</CardTitle>
        <CardDescription>
          .glb 또는 .gltf 파일을 업로드하세요 (최대 50MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-upload">3D 모델 파일 선택</Label>
          <div className="flex gap-2">
            <Input
              id="model-upload"
              type="file"
              accept=".glb,.gltf"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1"
            />
            <Button disabled={uploading} size="icon">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>업로드된 파일 (클릭하여 URL 복사)</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{file.url}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="3D 미리보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[600px]">
                        <DialogHeader>
                          <DialogTitle>{file.name}</DialogTitle>
                        </DialogHeader>
                        <Model3DPreview modelUrl={file.url} className="h-[500px]" />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(file.url)}
                      title="URL 복사"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => analyzeModel(file)}
                      title="AI 자동 매핑"
                      disabled={analyzing}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      title="새 탭에서 열기"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>자동 매핑 기능:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>업로드 시 AI가 자동으로 파일명을 분석합니다</li>
            <li>기존 온톨로지 스키마와 매칭하여 적합한 엔티티 타입을 제안합니다</li>
            <li>신뢰도와 함께 제안된 크기 정보를 제공합니다</li>
            <li>수락 시 자동으로 스키마에 3D 모델이 연결됩니다</li>
            <li>또는 <Sparkles className="inline h-3 w-3" /> 버튼을 눌러 수동으로 분석할 수 있습니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
