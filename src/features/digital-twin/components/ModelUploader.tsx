import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

export function ModelUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('3d-models')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('3d-models')
          .getPublicUrl(fileName);

        return { fileName: file.name, url: publicUrl };
      });

      const results = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => [...prev, ...results.map(r => r.fileName)]);
      
      toast({
        title: "업로드 완료",
        description: `${results.length}개의 3D 모델이 업로드되었습니다.`,
      });
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
            <Label>업로드된 파일</Label>
            <div className="space-y-1">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>참고:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>업로드한 모델은 온톨로지 스키마에서 엔티티 타입에 할당할 수 있습니다</li>
            <li>권장 포맷: .glb (바이너리 GLTF)</li>
            <li>모델 최적화를 위해 폴리곤 수를 최소화하세요</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
