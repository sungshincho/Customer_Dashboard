import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Search, RefreshCw, FileIcon, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface StorageManagerProps {
  storeId?: string;
}

interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  url: string;
  bucket: string;
}

export function StorageManager({ storeId }: StorageManagerProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (storeId) {
      loadAllFiles();
    }
  }, [storeId]);

  const loadAllFiles = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const folderPath = `${user.id}/${storeId}`;
      
      // store-data 버킷
      const { data: dataFiles } = await supabase.storage
        .from('store-data')
        .list(folderPath, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      // 3d-models 버킷
      const { data: modelFiles } = await supabase.storage
        .from('3d-models')
        .list(folderPath, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      const allFiles: StorageFile[] = [];

      // store-data 파일 추가
      if (dataFiles) {
        for (const file of dataFiles) {
          const filePath = `${folderPath}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('store-data')
            .getPublicUrl(filePath);

          allFiles.push({
            name: file.name,
            path: filePath,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            url: publicUrl,
            bucket: 'store-data'
          });
        }
      }

      // 3d-models 파일 추가
      if (modelFiles) {
        for (const file of modelFiles) {
          const filePath = `${folderPath}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('3d-models')
            .getPublicUrl(filePath);

          allFiles.push({
            name: file.name,
            path: filePath,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            url: publicUrl,
            bucket: '3d-models'
          });
        }
      }

      setFiles(allFiles);
    } catch (error: any) {
      console.error('Error loading files:', error);
      toast({
        title: "파일 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (bucket: string, path: string, name: string) => {
    if (!confirm(`"${name}" 파일을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      toast({
        title: "파일 삭제 완료",
        description: `${name}이 삭제되었습니다`,
      });

      loadAllFiles();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`선택한 ${selectedFiles.size}개의 파일을 삭제하시겠습니까?`)) return;

    setLoading(true);
    try {
      const filesByBucket = new Map<string, string[]>();
      
      files.forEach(file => {
        if (selectedFiles.has(file.path)) {
          const paths = filesByBucket.get(file.bucket) || [];
          paths.push(file.path);
          filesByBucket.set(file.bucket, paths);
        }
      });

      for (const [bucket, paths] of filesByBucket.entries()) {
        const { error } = await supabase.storage
          .from(bucket)
          .remove(paths);
        
        if (error) throw error;
      }

      toast({
        title: "일괄 삭제 완료",
        description: `${selectedFiles.size}개 파일이 삭제되었습니다`,
      });

      setSelectedFiles(new Set());
      loadAllFiles();
    } catch (error: any) {
      toast({
        title: "일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "다운로드 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleFileSelection = (path: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelectedFiles(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.path)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);

  if (!storeId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            사이드바에서 매장을 선택하면 스토리지를 관리할 수 있습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>스토리지 파일 관리</CardTitle>
        <CardDescription>
          모든 업로드된 파일을 한 곳에서 관리하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 검색 및 액션 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="파일명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllFiles}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제 ({selectedFiles.size})
            </Button>
          )}
        </div>

        {/* 통계 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>총 {filteredFiles.length}개 파일 · {formatFileSize(totalSize)}</span>
        </div>

        {/* 파일 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? '검색 결과가 없습니다' : '업로드된 파일이 없습니다'}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedFiles.size === filteredFiles.length}
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>버킷</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>업로드 일시</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.path}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.path)}
                        onCheckedChange={() => toggleFileSelection(file.path)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-primary" />
                        <span className="truncate max-w-xs" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {file.bucket}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.url, file.name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.bucket, file.path, file.name)}
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
  );
}
