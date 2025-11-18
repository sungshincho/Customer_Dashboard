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
  storeName?: string;
  storeId?: string;
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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const allFiles: StorageFile[] = [];
      
      // 매장 정보 가져오기
      const { data: stores } = await supabase
        .from('stores')
        .select('id, store_name')
        .eq('user_id', user.id);

      const storesToLoad = storeId 
        ? stores?.filter(s => s.id === storeId) || []
        : stores || [];

      // 각 매장별로 파일 조회
      for (const store of storesToLoad) {
        const basePath = `${user.id}/${store.id}`;
        
        // store-data 버킷
        const { data: dataFiles } = await supabase.storage
          .from('store-data')
          .list(basePath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (dataFiles) {
          for (const file of dataFiles) {
            if (!file.id) continue;
            
            const filePath = `${basePath}/${file.name}`;
            const { data: { publicUrl } } = supabase.storage
              .from('store-data')
              .getPublicUrl(filePath);

            allFiles.push({
              name: file.name,
              path: filePath,
              size: file.metadata?.size || 0,
              created_at: file.created_at,
              url: publicUrl,
              bucket: 'store-data',
              storeName: store.store_name,
              storeId: store.id
            });
          }
        }

        // 3d-models 버킷 (루트 레벨)
        const { data: modelRootFiles } = await supabase.storage
          .from('3d-models')
          .list(basePath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (modelRootFiles) {
          for (const file of modelRootFiles) {
            if (file.id && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
              const filePath = `${basePath}/${file.name}`;
              const { data: { publicUrl } } = supabase.storage
                .from('3d-models')
                .getPublicUrl(filePath);

              allFiles.push({
                name: file.name,
                path: filePath,
                size: file.metadata?.size || 0,
                created_at: file.created_at,
                url: publicUrl,
                bucket: '3d-models',
                storeName: store.store_name,
                storeId: store.id
              });
            }
          }
        }
      }

      setFiles(allFiles);
      console.log('✅ StorageManager loaded files:', allFiles.length, '파일 from', storesToLoad.length, '매장');
    } catch (error: any) {
      console.error('❌ StorageManager error:', error);
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
    if (!confirm(`"${name}" 파일 및 관련 데이터를 삭제하시겠습니까?`)) return;

    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 통합 삭제 Edge Function 호출
      const { data, error } = await supabase.functions.invoke('cleanup-integrated-data', {
        body: { filePaths: [path] },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast({
        title: "통합 삭제 완료",
        description: `${name} 및 관련 데이터 삭제 완료 (엔티티: ${data.entitiesDeleted}, 관계: ${data.relationsDeleted})`,
      });

      await loadAllFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "삭제 실패",
        description: error.message || "파일 삭제 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`선택한 ${selectedFiles.size}개 파일 및 관련 데이터를 삭제하시겠습니까?`)) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const filePaths = Array.from(selectedFiles);

      // 통합 삭제 Edge Function 호출
      const { data, error } = await supabase.functions.invoke('cleanup-integrated-data', {
        body: { filePaths },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast({
        title: "일괄 삭제 완료",
        description: `${data.storageFilesDeleted}개 파일 및 관련 데이터 삭제 (엔티티: ${data.entitiesDeleted}, 관계: ${data.relationsDeleted})`,
      });

      setSelectedFiles(new Set());
      await loadAllFiles();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({
        title: "삭제 실패",
        description: error.message || "파일 삭제 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm("⚠️ 모든 데이터를 삭제하시겠습니까?\n\n삭제 항목:\n- 스토리지 파일 (CSV, 3D 모델)\n- 데이터베이스 엔티티 및 관계\n- 3D 씬\n- 업로드 기록\n\n이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 전체 데이터 삭제
      const { data, error } = await supabase.functions.invoke('cleanup-integrated-data', {
        body: { 
          deleteAllData: true,
          storeId: storeId || undefined
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast({
        title: "전체 데이터 초기화 완료",
        description: `스토리지: ${data.storageFilesDeleted}개, 엔티티: ${data.entitiesDeleted}개, 관계: ${data.relationsDeleted}개, 씬: ${data.scenesDeleted}개`,
      });

      setSelectedFiles(new Set());
      await loadAllFiles();
    } catch (error: any) {
      console.error('Delete all error:', error);
      toast({
        title: "초기화 실패",
        description: error.message || "데이터 초기화 중 오류가 발생했습니다",
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
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);

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
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제 ({selectedFiles.size})
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAllData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            전체 초기화
          </Button>
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
                  <TableHead>매장</TableHead>
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
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded font-medium">
                        {file.storeName || '-'}
                      </span>
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
