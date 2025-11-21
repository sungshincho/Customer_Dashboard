import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Box, Wifi, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

interface UnifiedDataUploadProps {
  storeId?: string;
  onUploadSuccess?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  type: 'csv' | 'excel' | '3d-model' | 'wifi' | 'json' | 'unknown';
  status: 'pending' | 'uploading' | 'processing' | 'mapping' | 'success' | 'error';
  progress: number;
  error?: string;
  mappingResult?: any;
}

export function UnifiedDataUpload({ storeId, onUploadSuccess }: UnifiedDataUploadProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 파일 타입 자동 감지
  const detectFileType = (file: File): UploadFile['type'] => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    if (ext === 'glb' || ext === 'gltf') return '3d-model';
    if (file.name.includes('wifi') || file.name.includes('tracking') || file.name.includes('sensor')) {
      return 'wifi';
    }
    if (ext === 'json') {
      if (file.name.includes('wifi')) return 'wifi';
      if (file.name.includes('metadata') || file.name.includes('3d')) return 'json';
      return 'json';
    }
    
    return 'unknown';
  };

  // 파일 선택/드롭 처리
  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadFiles: UploadFile[] = fileArray.map(file => {
      const fileName = file.name.toLowerCase();
      
      // 파생 데이터 파일 감지 및 경고
      if (fileName.includes('dashboard_kpi') || fileName.includes('ai_recommendation')) {
        toast({
          title: '⚠️ 자동 생성 데이터',
          description: `${file.name}는 백엔드에서 자동 생성되는 파일입니다. 원천 데이터를 업로드하면 자동으로 집계됩니다.`,
          variant: 'destructive',
        });
      }
      
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        type: detectFileType(file),
        status: 'pending' as const,
        progress: 0,
      };
    });

    setFiles(prev => [...prev, ...uploadFiles]);
  }, [toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // CSV/Excel/JSON 파싱
  const parseDataFile = async (file: File): Promise<any[]> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(firstSheet);
    } else if (ext === 'json') {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      // JSON이 배열이면 그대로, 객체면 배열로 감싸기
      return Array.isArray(jsonData) ? jsonData : [jsonData];
    }
    
    return [];
  };

  // 자동 매핑 실행
  const runAutoMapping = async (uploadFile: UploadFile, rawData: any[], filePath?: string) => {
    if (rawData.length === 0) return null;

    try {
      const columns = Object.keys(rawData[0]);
      const dataSample = rawData.slice(0, 5);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자');

      const { data: importRecord } = await supabase
        .from('user_data_imports')
        .insert({
          file_name: uploadFile.file.name,
          file_type: uploadFile.type,
          data_type: 'auto-detected',
          raw_data: rawData as any,
          row_count: rawData.length,
          store_id: storeId || null,
          user_id: user.id,
          file_path: filePath || null,
        })
        .select()
        .single();

      if (!importRecord) return null;

      const { data: mappingResult, error: mappingError } = await supabase.functions.invoke('auto-map-etl', {
        body: {
          import_id: importRecord.id,
          data_sample: dataSample,
          columns: columns,
        }
      });

      if (mappingError) throw mappingError;
      return { importId: importRecord.id, ...mappingResult };
    } catch (error) {
      console.error('Auto mapping error:', error);
      return null;
    }
  };

  // 파일명 sanitize (특수문자 제거)
  const sanitizeFileName = (fileName: string): string => {
    // 확장자 분리
    const lastDot = fileName.lastIndexOf('.');
    const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    const ext = lastDot > 0 ? fileName.substring(lastDot) : '';
    
    // 안전한 문자만 허용 (영문, 숫자, 언더스코어, 하이픈, 점)
    // 한글, 공백, 괄호 등을 언더스코어로 변환
    const safeName = name
      .replace(/[^\w\-\.]/g, '_')  // 특수문자를 _로 변환
      .replace(/_{2,}/g, '_')       // 연속된 _를 하나로
      .replace(/^_+|_+$/g, '');     // 앞뒤 _제거
    
    return safeName + ext;
  };

  // 개별 파일 업로드 처리
  const uploadFile = async (uploadFile: UploadFile) => {
    if (!storeId) {
      updateFileStatus(uploadFile.id, 'error', 'Store ID가 필요합니다');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자');

      updateFileStatus(uploadFile.id, 'uploading', undefined, 10);

      // 파일명 sanitize
      const safeFileName = sanitizeFileName(uploadFile.file.name);

      // 파일 타입별 업로드
      if (uploadFile.type === '3d-model') {
        // === 완전 자동화 3D 모델 파이프라인 ===
        const filePath = `${user.id}/${storeId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('3d-models')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        
        // 업로드된 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('3d-models')
          .getPublicUrl(filePath);
        
        // Step 1: 3D 모델 AI 분석 및 엔티티 타입 자동 생성
        updateFileStatus(uploadFile.id, 'processing', 'AI 분석 중...', 40);
        
        try {
          const { data: processResult, error: processError } = await supabase.functions.invoke('auto-process-3d-models', {
            body: {
              files: [{
                fileName: safeFileName,
                publicUrl: publicUrl
              }],
              storeId: storeId
            }
          });
          
          if (processError) throw processError;
          
          if (processResult?.success && processResult.results?.[0]) {
            const result = processResult.results[0];
            
            // Step 2: user_data_imports에 기록 추가
            updateFileStatus(uploadFile.id, 'processing', '데이터 기록 중...', 60);
            await supabase.from('user_data_imports').insert({
              user_id: user.id,
              store_id: storeId,
              file_name: safeFileName,
              file_type: '3d_model',
              data_type: '3d_model',
              file_path: filePath,
              row_count: 1,
              raw_data: {
                entityType: result?.entityType,
                instanceLabel: result?.instanceLabel,
                position: result?.position,
                publicUrl: publicUrl
              }
            });
            
            // Step 3: 기존 엔티티에 3D 모델 자동 매핑
            updateFileStatus(uploadFile.id, 'processing', '기존 엔티티에 매핑 중...', 75);
            
            // AI가 생성한 엔티티 타입 이름으로 기존 엔티티 찾기
            const { data: entityType } = await supabase
              .from('ontology_entity_types')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', result.entityType)
              .single();

            let mappedCount = 0;
            if (entityType) {
              // 해당 타입의 엔티티 중 3D 모델이 없는 엔티티 찾기 (최대 10개)
              const { data: entitiesToMap } = await supabase
                .from('graph_entities')
                .select('id')
                .eq('user_id', user.id)
                .eq('store_id', storeId)
                .eq('entity_type_id', entityType.id)
                .is('model_3d_position', null)
                .limit(10);

              if (entitiesToMap && entitiesToMap.length > 0) {
                console.log(`🔗 Auto-mapping 3D model to ${entitiesToMap.length} entities...`);
                
                // 그리드 형태로 자동 배치
                const updates = entitiesToMap.map((entity, idx) => 
                  supabase
                    .from('graph_entities')
                    .update({
                      model_3d_position: { x: idx * 2, y: 0, z: 0 },
                      model_3d_scale: { x: 1, y: 1, z: 1 },
                      model_3d_rotation: { x: 0, y: 0, z: 0 }
                    })
                    .eq('id', entity.id)
                );
                
                await Promise.all(updates);
                mappedCount = entitiesToMap.length;
                console.log(`✅ 3D models auto-mapped to ${mappedCount} entities`);
              }
            }
            
            updateFileStatus(uploadFile.id, 'success', undefined, 100, {
              autoMapped: true,
              entityType: result?.entityType || '자동 생성됨',
              instanceLabel: result?.instanceLabel,
              position: result?.position,
              entitiesMapped: mappedCount,
              linkedToOntology: true
            });
          } else {
            throw new Error(processResult?.error || '자동 처리 실패');
          }
        } catch (err: any) {
          console.error('❌ 3D model processing failed:', err);
          updateFileStatus(uploadFile.id, 'error', err.message || '자동 처리 실패');
        }
        
      } else if (uploadFile.type === 'csv' || uploadFile.type === 'excel') {
        // === 완전 자동화 CSV/Excel 파이프라인 ===
        updateFileStatus(uploadFile.id, 'processing', '파일 업로드 중...', 15);
        
        const filePath = `${user.id}/${storeId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('store-data')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        
        // Step 1: 데이터 파싱
        updateFileStatus(uploadFile.id, 'processing', '데이터 파싱 중...', 25);
        const rawData = await parseDataFile(uploadFile.file);
        
        // Step 2: user_data_imports에 레코드 생성
        updateFileStatus(uploadFile.id, 'processing', '데이터 검증 준비 중...', 35);
        const { data: importRecord, error: importError } = await supabase
          .from('user_data_imports')
          .insert({
            file_name: safeFileName,
            file_type: uploadFile.type,
            data_type: 'auto-detected',
            raw_data: rawData as any,
            row_count: rawData.length,
            store_id: storeId || null,
            user_id: user.id,
            file_path: filePath,
          })
          .select()
          .single();

        if (importError || !importRecord) {
          throw new Error(`Import record creation failed: ${importError?.message}`);
        }

        // Step 3: 데이터 자동 수정 (검증 및 정리)
        console.log('🔧 Step 3: Auto-fixing data...');
        updateFileStatus(uploadFile.id, 'processing', '데이터 검증 및 자동 수정 중...', 45);
        
        try {
          const { data: fixResult, error: fixError } = await supabase.functions.invoke('auto-fix-data', {
            body: {
              importId: importRecord.id,
              options: {
                removeDuplicates: true,
                fillEmptyValues: true,
                convertTypes: true,
                useAI: false,
              },
            },
          });

          if (fixError) {
            console.warn('⚠️ Auto-fix warning:', fixError);
          } else {
            console.log('✅ Data auto-fixed:', fixResult);
          }
        } catch (fixErr) {
          console.warn('⚠️ Auto-fix failed (continuing):', fixErr);
        }

        // Step 4: 자동 매핑
        updateFileStatus(uploadFile.id, 'mapping', '스키마 자동 매핑 중...', 55);
        const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        const dataSample = rawData.slice(0, 5);

        const { data: mappingResult, error: mappingError } = await supabase.functions.invoke('auto-map-etl', {
          body: {
            import_id: importRecord.id,
            data_sample: dataSample,
            columns: columns,
          }
        });

        if (mappingError || !mappingResult) {
          throw new Error(`Auto-mapping failed: ${mappingError?.message || 'No mapping result'}`);
        }

        console.log('✅ Auto-mapping completed:', mappingResult);
        
        // Step 5: ETL 실행 (온톨로지 변환)
        if (mappingResult && storeId) {
          try {
            updateFileStatus(uploadFile.id, 'processing', '온톨로지 엔티티 생성 중...', 70);
            
            const { data: etlResult, error: etlError } = await supabase.functions.invoke('schema-etl', {
              body: {
                user_id: user.id,
                store_id: storeId,
                import_id: importRecord.id,
                entity_mappings: mappingResult.entity_mappings || [],
                relation_mappings: mappingResult.relation_mappings || []
              }
            });

            if (etlError) throw etlError;
            
            updateFileStatus(uploadFile.id, 'processing', 'KPI 집계 및 AI 분석 중...', 85);

            // Step 4: 백그라운드 작업 (KPI 집계 + AI 추천)
            // 비동기로 실행하여 사용자 경험 개선
            (async () => {
              try {
                console.log('📊 Step 4: KPI aggregation for all dates...');
                const { data: aggregateResult, error: aggregateError } = await supabase.functions.invoke('aggregate-all-kpis', {
                  body: { 
                    store_id: storeId,
                    user_id: user.id
                  },
                });
                
                if (aggregateError) {
                  console.warn('⚠️ KPI aggregation warning:', aggregateError);
                } else {
                  console.log('✅ Dashboard KPIs aggregated:', aggregateResult);
                }
                
                // Step 5: AI 추천 자동 생성
                console.log('🤖 Step 5: Generating AI recommendations...');
                const { error: aiError } = await supabase.functions.invoke('generate-ai-recommendations', {
                  body: { store_id: storeId },
                });
                
                if (aiError) {
                  console.warn('⚠️ AI recommendations warning:', aiError);
                } else {
                  console.log('✅ AI recommendations generated');
                }
              } catch (bgError) {
                console.warn('⚠️ Background processing failed (non-critical):', bgError);
              }
            })();
            
            updateFileStatus(uploadFile.id, 'success', '모든 자동화 프로세스 완료!', 100, {
              ...mappingResult,
              autoMapped: true,
              autoFixed: true,
              entitiesCreated: etlResult?.entities_created || 0,
              relationsCreated: etlResult?.relations_created || 0,
              kpiAggregated: true,
              aiGenerated: true,
              filePath
            });
            
            console.log('🎉 CSV 완전 자동화 파이프라인 완료!');
            toast({ title: `${safeFileName} 업로드 및 분석 완료!` });
          } catch (etlError) {
            console.error('❌ Auto ETL error:', etlError);
            
            // 재시도 로직 (1회) - 파라미터 수정
            console.log('🔄 Retrying ETL process...');
            try {
              const { data: retryResult, error: retryError } = await supabase.functions.invoke('schema-etl', {
                body: {
                  user_id: user.id,
                  store_id: storeId,
                  import_id: importRecord.id,
                  entity_mappings: mappingResult.entity_mappings || [],
                  relation_mappings: mappingResult.relation_mappings || []
                },
              });
              
              if (!retryError && retryResult) {
                console.log('✅ ETL succeeded on retry');
                
                // 재시도 성공 시에도 백그라운드 작업 실행
                (async () => {
                  try {
                    await supabase.functions.invoke('aggregate-all-kpis', {
                      body: { store_id: storeId, user_id: user.id },
                    });
                    await supabase.functions.invoke('generate-ai-recommendations', {
                      body: { store_id: storeId },
                    });
                  } catch (bgErr) {
                    console.warn('⚠️ Background tasks failed (non-critical):', bgErr);
                  }
                })();
                
                updateFileStatus(uploadFile.id, 'success', '재시도 성공!', 100, {
                  ...mappingResult,
                  autoMapped: true,
                  autoFixed: true,
                  retriedETL: true,
                  entitiesCreated: retryResult?.entities_created || 0,
                  kpiAggregated: true,
                  aiGenerated: true,
                  filePath
                });
                toast({ title: `${safeFileName} 재시도 성공!` });
              } else {
                throw retryError || new Error('Retry failed');
              }
            } catch (retryErr) {
              console.error('❌ ETL retry also failed:', retryErr);
              updateFileStatus(uploadFile.id, 'error', `ETL 실패: ${(etlError as Error).message}`);
              toast({ title: `${safeFileName} 변환 실패`, description: '수동 확인 필요', variant: 'destructive' });
            }
          }
        } else {
          console.log('⚠️ No mapping result, skipping ETL');
          updateFileStatus(uploadFile.id, 'success', '업로드 완료 (매핑 없음)', 100, { filePath });
        }
        
      } else if (uploadFile.type === 'wifi') {
        // WiFi 데이터는 store-data 버킷에 업로드
        const filePath = `${user.id}/${storeId}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('store-data')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        
        updateFileStatus(uploadFile.id, 'processing', undefined, 50);
        
        // WiFi 데이터 자동 처리
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-wifi-data', {
          body: {
            filePath,
            storeId
          }
        });

        if (processError) throw processError;

        if (processResult?.success) {
          updateFileStatus(uploadFile.id, 'success', undefined, 100, {
            processedCount: processResult.processedCount,
            metadataGenerated: !!processResult.metadata
          });
        } else {
          throw new Error(processResult?.error || 'WiFi 데이터 처리 실패');
        }
        
      } else if (uploadFile.type === 'json') {
        // JSON 메타데이터는 store-data 버킷에 업로드
        updateFileStatus(uploadFile.id, 'processing', '파일 업로드 중...', 20);
        
        const filePath = `${user.id}/${storeId}/metadata/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('store-data')
          .upload(filePath, uploadFile.file, { upsert: true });

        if (uploadError) throw uploadError;
        
        updateFileStatus(uploadFile.id, 'processing', '데이터 파싱 중...', 50);
        const rawData = await parseDataFile(uploadFile.file);
        
        // user_data_imports에 기록
        const { data: importData, error: importError } = await supabase
          .from('user_data_imports')
          .insert({
            user_id: user.id,
            store_id: storeId,
            file_name: safeFileName,
            file_type: 'json',
            data_type: 'metadata',
            file_path: filePath,
            row_count: rawData.length,
            raw_data: rawData
          })
          .select()
          .single();

        if (importError) throw importError;
        
        updateFileStatus(uploadFile.id, 'success', undefined, 100, {
          importId: importData.id,
          recordCount: rawData.length,
          filePath
        });
        
      } else {
        throw new Error('지원하지 않는 파일 타입');
      }

      toast({
        title: "업로드 완료",
        description: `${uploadFile.file.name}이 성공적으로 업로드되었습니다`,
      });

    } catch (error: any) {
      updateFileStatus(uploadFile.id, 'error', error.message);
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateFileStatus = (
    id: string, 
    status: UploadFile['status'], 
    error?: string, 
    progress?: number,
    mappingResult?: any
  ) => {
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status, error, progress: progress ?? f.progress, mappingResult } 
        : f
    ));
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
    onUploadSuccess?.();
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const getFileTypeIcon = (type: UploadFile['type']) => {
    switch (type) {
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5" />;
      case '3d-model':
        return <Box className="w-5 h-5" />;
      case 'wifi':
        return <Wifi className="w-5 h-5" />;
      case 'json':
        return <FileSpreadsheet className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getFileTypeBadge = (type: UploadFile['type']) => {
    const variants: Record<UploadFile['type'], string> = {
      'csv': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'excel': 'bg-green-500/10 text-green-500 border-green-500/20',
      '3d-model': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'wifi': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'json': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      'unknown': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };

    const labels: Record<UploadFile['type'], string> = {
      'csv': 'CSV',
      'excel': 'Excel',
      '3d-model': '3D 모델',
      'wifi': 'WiFi',
      'json': 'JSON',
      'unknown': '알 수 없음',
    };

    return (
      <Badge variant="outline" className={variants[type]}>
        {labels[type]}
      </Badge>
    );
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
      case 'mapping':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  const getStatusText = (uploadFile: UploadFile) => {
    if (uploadFile.status === 'success' && uploadFile.mappingResult) {
      if (uploadFile.type === '3d-model') {
        if (uploadFile.mappingResult.autoMapped) {
          const instanceInfo = uploadFile.mappingResult.instanceLabel 
            ? ` → ${uploadFile.mappingResult.instanceLabel}` 
            : '';
          return `자동 매핑 완료: ${uploadFile.mappingResult.entityType}${instanceInfo}`;
        } else {
          return uploadFile.mappingResult.message || '업로드 완료';
        }
      } else if (uploadFile.mappingResult.importId) {
        return `자동 매핑 완료 (Import ID: ${uploadFile.mappingResult.importId})`;
      }
    }
    
    const statusMap = {
      pending: '대기 중',
      uploading: '업로드 중...',
      processing: '처리 중...',
      mapping: '자동 매핑 중...',
      success: '완료',
      error: uploadFile.error || '실패'
    };
    return statusMap[uploadFile.status];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>통합 데이터 업로드</CardTitle>
        <CardDescription>
          모든 타입의 데이터를 한 번에 업로드하고 자동으로 인식/매핑합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!storeId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              매장을 먼저 선택해주세요
            </AlertDescription>
          </Alert>
        )}

        {/* 드래그 앤 드롭 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            파일을 여기에 드롭하거나 클릭하여 선택
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            CSV, Excel, 3D 모델(.glb/.gltf), WiFi 데이터 지원
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".csv,.xlsx,.xls,.glb,.gltf,.json"
            onChange={handleFileInput}
            className="hidden"
            disabled={!storeId}
          />
          <Button asChild disabled={!storeId}>
            <label htmlFor="file-upload" className="cursor-pointer">
              파일 선택
            </label>
          </Button>
        </div>

        {/* 업로드 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">업로드 대기 중인 파일 ({files.length})</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={!files.some(f => f.status === 'success')}
                >
                  완료된 항목 제거
                </Button>
                <Button
                  onClick={uploadAllFiles}
                  disabled={!files.some(f => f.status === 'pending')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  모두 업로드
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileTypeIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{file.file.name}</p>
                          {getFileTypeBadge(file.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      {file.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {file.status !== 'pending' && file.status !== 'success' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getStatusText(file)}
                        </span>
                        <span className="font-medium">{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} />
                    </div>
                  )}

                  {file.status === 'success' && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {getStatusText(file)}
                    </div>
                  )}

                  {file.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{file.error}</AlertDescription>
                    </Alert>
                  )}

                  {file.mappingResult && file.mappingResult.entity_mappings && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        자동 매핑 완료: {file.mappingResult.entity_mappings?.length || 0}개 엔티티, {' '}
                        {file.mappingResult.relation_mappings?.length || 0}개 관계
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
