// ============================================================================
// DataImportWidget.tsx
// 데이터 임포트 위젯 - 5단계 워크플로우
// Phase 1: MVP Implementation
// Phase 2: AI 매핑 통합, 검증 강화
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  X,
  Package,
  Users,
  CreditCard,
  UserCog,
  Boxes,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

type ImportType = 'products' | 'customers' | 'transactions' | 'staff' | 'inventory';
type ImportStep = 'upload' | 'mapping' | 'validate' | 'import' | 'complete';

interface ImportTypeOption {
  type: ImportType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface Session {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  import_type: string;
  target_table: string;
  status: string;
}

interface ParseResult {
  columns: string[];
  preview: Record<string, unknown>[];
  suggested_mapping: Record<string, string | null>;
  total_rows: number;
}

interface ValidationResult {
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  can_import: boolean;
}

interface ImportResult {
  status: string;
  imported_rows: number;
  failed_rows: number;
  progress?: { current: number; total: number; percentage: number };
}

// ============================================================================
// Constants
// ============================================================================

const IMPORT_TYPES: ImportTypeOption[] = [
  {
    type: 'products',
    label: '상품',
    icon: <Package className="w-5 h-5" />,
    description: '상품 마스터 데이터',
  },
  {
    type: 'customers',
    label: '고객',
    icon: <Users className="w-5 h-5" />,
    description: '고객 정보',
  },
  {
    type: 'transactions',
    label: '거래',
    icon: <CreditCard className="w-5 h-5" />,
    description: '거래 내역',
  },
  {
    type: 'staff',
    label: '직원',
    icon: <UserCog className="w-5 h-5" />,
    description: '직원 정보',
  },
  {
    type: 'inventory',
    label: '재고',
    icon: <Boxes className="w-5 h-5" />,
    description: '재고 수준',
  },
];

const STEPS: ImportStep[] = ['upload', 'mapping', 'validate', 'import', 'complete'];

const STEP_LABELS: Record<ImportStep, string> = {
  upload: '파일 선택',
  mapping: '필드 매핑',
  validate: '검증',
  import: '임포트',
  complete: '완료',
};

// 필수 필드 정의
const REQUIRED_FIELDS: Record<ImportType, string[]> = {
  products: ['product_name', 'sku', 'category', 'price'],
  customers: ['customer_name'],
  transactions: ['transaction_date', 'total_amount'],
  staff: ['staff_name', 'staff_code', 'role'],
  inventory: ['product_sku', 'quantity'],
};

// 필드 설명 (툴팁용)
const FIELD_DESCRIPTIONS: Record<string, string> = {
  // Products
  product_name: '상품명 (필수)',
  sku: 'SKU 코드 - 고유 상품 식별자 (필수)',
  category: '상품 카테고리 (필수)',
  price: '판매가격 (필수)',
  cost_price: '원가/입고가',
  stock: '현재 재고 수량',
  display_type: '진열 방식 (hanging, standing, folded 등)',
  // Customers
  customer_name: '고객명 (필수)',
  email: '이메일 주소',
  phone: '연락처',
  segment: '고객 세그먼트 (VIP, Regular, New, Dormant)',
  total_purchases: '총 구매 금액',
  last_visit_date: '마지막 방문일',
  // Transactions
  transaction_date: '거래일시 (필수)',
  total_amount: '거래 총액 (필수)',
  payment_method: '결제 수단',
  customer_email: '고객 이메일',
  item_sku: '상품 SKU',
  quantity: '수량',
  unit_price: '단가',
  // Staff
  staff_name: '직원명 (필수)',
  staff_code: '직원 코드 (필수)',
  role: '직무 역할 (필수)',
  department: '부서',
  // Inventory
  product_sku: '상품 SKU (필수)',
  min_stock: '최소 재고 수준',
  max_stock: '최대 재고 수준',
  reorder_point: '재주문점',
  location: '위치/구역',
};

// ============================================================================
// Component
// ============================================================================

interface DataImportWidgetProps {
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

export function DataImportWidget({ onImportComplete, className }: DataImportWidgetProps) {
  // State
  const [importType, setImportType] = useState<ImportType>('products');
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [session, setSession] = useState<Session | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiMapping, setIsAiMapping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  // ============================================================================
  // File Upload Handlers
  // ============================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [importType]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [importType]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // 파일 검증
      const validExtensions = ['csv', 'xlsx', 'xls', 'json'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !validExtensions.includes(extension)) {
        throw new Error('지원하지 않는 파일 형식입니다. CSV, Excel, JSON 파일만 가능합니다.');
      }

      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_type', importType);
      if (selectedStore?.id) {
        formData.append('store_id', selectedStore.id);
      }
      if (orgId) {
        formData.append('org_id', orgId);
      }

      // 파일 업로드
      const uploadResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || '파일 업로드에 실패했습니다.');
      }

      setSession(uploadData.session);
      console.log('File uploaded:', uploadData.session);

      // 파일 파싱 요청
      const parseResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ session_id: uploadData.session.id }),
        }
      );

      const parseData = await parseResponse.json();
      if (!parseData.success) {
        throw new Error(parseData.error || '파일 파싱에 실패했습니다.');
      }

      setParseResult(parseData);
      setMapping(parseData.suggested_mapping || {});
      setCurrentStep('mapping');

      toast({
        title: '파일 업로드 완료',
        description: `${file.name} (${parseData.total_rows}행)`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(message);
      toast({
        title: '업로드 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Validation Handler
  // ============================================================================

  const handleValidate = async () => {
    if (!session || !parseResult) return;

    setIsLoading(true);
    setError(null);

    try {
      // 필수 필드 확인
      const requiredFields = REQUIRED_FIELDS[importType];
      const missingFields = requiredFields.filter((field) => !mapping[field]);

      if (missingFields.length > 0) {
        throw new Error(`필수 필드가 매핑되지 않았습니다: ${missingFields.join(', ')}`);
      }

      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // validate-data Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            session_id: session.id,
            column_mapping: mapping,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '검증에 실패했습니다.');
      }

      const validationResult: ValidationResult = {
        total_rows: data.total_rows,
        valid_rows: data.valid_rows,
        error_rows: data.error_rows,
        errors: data.errors || [],
        can_import: data.can_import,
      };

      setValidation(validationResult);
      setCurrentStep('validate');

      toast({
        title: '검증 완료',
        description: `${validationResult.valid_rows}/${validationResult.total_rows} 행 유효`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '검증 실패';
      setError(message);
      toast({
        title: '검증 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Import Handler
  // ============================================================================

  const handleImport = async () => {
    if (!session || !validation?.can_import) return;

    setIsLoading(true);
    setError(null);
    setCurrentStep('import');

    try {
      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // execute-import Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            session_id: session.id,
            column_mapping: mapping,
            options: {
              upsert: true,
              batch_size: 100,
              skip_errors: true,
            },
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '임포트에 실패했습니다.');
      }

      const result: ImportResult = {
        status: data.status,
        imported_rows: data.imported_rows,
        failed_rows: data.failed_rows,
        progress: {
          current: data.imported_rows + data.failed_rows,
          total: validation.total_rows,
          percentage: 100,
        },
      };

      setImportResult(result);
      setCurrentStep('complete');

      toast({
        title: '임포트 완료',
        description: `${result.imported_rows}행이 성공적으로 임포트되었습니다.`,
      });

      onImportComplete?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '임포트 실패';
      setError(message);
      setCurrentStep('validate');
      toast({
        title: '임포트 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Reset Handler
  // ============================================================================

  const handleReset = () => {
    setCurrentStep('upload');
    setSession(null);
    setParseResult(null);
    setMapping({});
    setValidation(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================================================
  // Sample Download Handler
  // ============================================================================

  const handleDownloadSample = (format: 'csv' | 'xlsx') => {
    // TODO: 실제 샘플 파일 다운로드 구현
    const sampleCSV = {
      products: 'product_name,sku,category,price,stock,display_type\n프리미엄 캐시미어 코트,SKU-OUT-001,아우터,450000,15,hanging',
      customers: 'customer_name,email,phone,segment,total_purchases\n김철수,kim@example.com,010-1234-5678,VIP,2500000',
      transactions: 'transaction_date,total_amount,payment_method,customer_email\n2025-01-10,450000,card,kim@example.com',
      staff: 'staff_code,staff_name,role,department\nEMP001,매니저,manager,관리',
      inventory: 'product_sku,quantity,min_stock,max_stock\nSKU-OUT-001,15,5,30',
    };

    const blob = new Blob([sampleCSV[importType]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${importType}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // AI Mapping Handler
  // ============================================================================

  const handleAiMapping = async () => {
    if (!session || !parseResult) return;

    setIsAiMapping(true);
    setError(null);

    try {
      // 토큰 가져오기
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // 샘플 데이터로 AI 매핑 요청
      const sampleData = parseResult.preview.slice(0, 3);

      // auto-map-etl Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-map-etl`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            source_columns: parseResult.columns,
            sample_data: sampleData,
            target_schema: importType,
            required_fields: REQUIRED_FIELDS[importType],
          }),
        }
      );

      if (!response.ok) {
        // AI 매핑 서비스가 없는 경우 fallback
        throw new Error('AI 매핑 서비스 연결 실패');
      }

      const data = await response.json();

      if (!data.success || !data.mapping) {
        throw new Error(data.error || 'AI 매핑 결과를 가져올 수 없습니다.');
      }

      // AI 매핑 결과 적용
      const aiMapping: Record<string, string> = {};
      for (const [targetField, sourceField] of Object.entries(data.mapping)) {
        if (sourceField && parseResult.columns.includes(sourceField as string)) {
          aiMapping[targetField] = sourceField as string;
        } else if (mapping[targetField]) {
          // 기존 매핑 유지
          aiMapping[targetField] = mapping[targetField];
        }
      }

      // 기존 매핑에 없는 필드도 포함
      for (const [targetField, sourceField] of Object.entries(mapping)) {
        if (!aiMapping[targetField]) {
          aiMapping[targetField] = sourceField;
        }
      }

      setMapping(aiMapping);

      toast({
        title: 'AI 매핑 완료',
        description: 'AI가 컬럼 매핑을 제안했습니다. 확인 후 필요시 수정하세요.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 매핑 실패';
      console.warn('AI mapping failed, using rule-based mapping:', message);

      toast({
        title: 'AI 매핑 사용 불가',
        description: '규칙 기반 매핑을 사용합니다.',
        variant: 'default',
      });
    } finally {
      setIsAiMapping(false);
    }
  };

  // 매핑 초기화 핸들러
  const handleResetMapping = () => {
    if (parseResult?.suggested_mapping) {
      setMapping(parseResult.suggested_mapping as Record<string, string>);
      toast({
        title: '매핑 초기화',
        description: '자동 감지된 매핑으로 초기화되었습니다.',
      });
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isRequiredField = (field: string) => REQUIRED_FIELDS[importType]?.includes(field);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            데이터 임포트
          </CardTitle>

          {/* Step Indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  title={STEP_LABELS[step]}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1: File Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            {/* Import Type Selection */}
            <div className="grid grid-cols-5 gap-2">
              {IMPORT_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setImportType(item.type)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    importType === item.type
                      ? 'bg-primary/10 border-2 border-primary text-primary'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </button>
              ))}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isLoading ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              )}
              <p className="text-foreground mb-2">
                {isLoading
                  ? '파일 업로드 중...'
                  : isDragging
                  ? '파일을 놓으세요'
                  : '파일을 드래그하거나 클릭하여 선택'}
              </p>
              <p className="text-sm text-muted-foreground">
                지원 포맷: CSV, Excel (.xlsx, .xls), JSON
              </p>
            </div>

            {/* Sample Download */}
            <div className="flex justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadSample('csv')}
                className="text-primary"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                샘플 CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadSample('xlsx')}
                className="text-primary"
              >
                <Download className="w-4 h-4 mr-1" />
                샘플 Excel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {currentStep === 'mapping' && parseResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                파일: {session?.file_name}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{parseResult.total_rows}행</Badge>
                {/* AI 매핑 버튼 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAiMapping}
                        disabled={isAiMapping}
                        className="gap-1"
                      >
                        {isAiMapping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        AI 매핑
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI가 컬럼을 자동으로 매핑합니다</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* 매핑 초기화 버튼 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetMapping}
                        className="gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>초기 매핑으로 되돌리기</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Mapping Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">시스템 필드</TableHead>
                    <TableHead className="w-1/3">파일 컬럼</TableHead>
                    <TableHead className="w-1/3">샘플 데이터</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mapping).map(([targetField, sourceField]) => (
                    <TableRow key={targetField}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {targetField}
                            {isRequiredField(targetField) && (
                              <span className="text-destructive ml-0.5">*</span>
                            )}
                          </span>
                          {FIELD_DESCRIPTIONS[targetField] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{FIELD_DESCRIPTIONS[targetField]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sourceField || ''}
                          onValueChange={(value) =>
                            setMapping({ ...mapping, [targetField]: value })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="선택 안함" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- 선택 안함 --</SelectItem>
                            {parseResult.columns.map((col) => (
                              <SelectItem key={col} value={col}>
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sourceField && parseResult.preview[0]?.[sourceField]?.toString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">
                데이터 프리뷰 (처음 5행)
              </h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parseResult.columns.map((col) => (
                        <TableHead key={col} className="text-xs whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.preview.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {parseResult.columns.map((col) => (
                          <TableCell key={col} className="text-xs">
                            {row[col]?.toString() || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              <Button onClick={handleValidate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-1" />
                )}
                검증하기
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === 'validate' && validation && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{validation.total_rows}</div>
                <div className="text-xs text-muted-foreground">전체 행</div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validation.valid_rows}
                </div>
                <div className="text-xs text-muted-foreground">유효한 행</div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validation.error_rows}
                </div>
                <div className="text-xs text-muted-foreground">에러 행</div>
              </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-1 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  검증 에러 ({validation.errors.length}건)
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {validation.errors.slice(0, 20).map((err, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      행 {err.row}: {err.field} - {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Can Import */}
            {validation.can_import && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600 text-sm">임포트 가능합니다</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validation.can_import || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-1" />
                )}
                임포트 실행
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Import Progress */}
        {currentStep === 'import' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-foreground">데이터를 임포트하는 중...</p>
            </div>

            {importResult?.progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {importResult.progress.current} / {importResult.progress.total}
                  </span>
                  <span>{importResult.progress.percentage}%</span>
                </div>
                <Progress value={importResult.progress.percentage} />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === 'complete' && importResult && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h4 className="text-xl font-semibold">임포트 완료</h4>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported_rows}
                </div>
                <div className="text-xs text-muted-foreground">성공</div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failed_rows}
                </div>
                <div className="text-xs text-muted-foreground">실패</div>
              </div>
            </div>

            <Button onClick={handleReset} className="mt-4">
              새 임포트
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataImportWidget;
