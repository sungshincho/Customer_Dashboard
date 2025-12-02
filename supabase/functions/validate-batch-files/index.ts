import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileData {
  fileName: string;
  tableName: string;
  headers: string[];
  sampleRows: any[];
}

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  column?: string;
  row?: number;
}

interface FileValidationResult {
  fileName: string;
  tableName: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, schema } = await req.json();

    console.log(`Validating ${files.length} files...`);

    const results: FileValidationResult[] = [];
    const tableFiles: Record<string, string[]> = {};

    // 각 파일 검증
    for (const file of files) {
      const { fileName, tableName, headers, sampleRows } = file;
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // 테이블이 스키마에 존재하는지 확인
      if (!schema[tableName]) {
        errors.push({
          type: 'error',
          message: `테이블 '${tableName}'이(가) 데이터베이스에 존재하지 않습니다.`
        });
        results.push({
          fileName,
          tableName,
          isValid: false,
          errors,
          warnings
        });
        continue;
      }

      const tableSchema = schema[tableName];
      const requiredColumns = tableSchema.columns
        .filter((c: any) => !c.is_nullable && !c.column_default)
        .map((c: any) => c.column_name);

      // 1. 필수 컬럼 체크
      for (const reqCol of requiredColumns) {
        if (!headers.includes(reqCol)) {
          errors.push({
            type: 'error',
            message: `필수 컬럼 '${reqCol}'이(가) 누락되었습니다.`,
            column: reqCol
          });
        }
      }

      // 2. 존재하지 않는 컬럼 체크
      const validColumns = tableSchema.columns.map((c: any) => c.column_name);
      for (const header of headers) {
        if (!validColumns.includes(header)) {
          warnings.push({
            type: 'warning',
            message: `컬럼 '${header}'은(는) 테이블에 존재하지 않습니다. raw_data에 저장됩니다.`,
            column: header
          });
        }
      }

      // 3. 데이터 타입 체크 (샘플 행 기준)
      for (let i = 0; i < Math.min(sampleRows.length, 5); i++) {
        const row = sampleRows[i];
        for (const [key, value] of Object.entries(row)) {
          const column = tableSchema.columns.find((c: any) => c.column_name === key);
          if (!column) continue;

          // NULL 체크
          if ((value === null || value === '') && !column.is_nullable && !column.column_default) {
            errors.push({
              type: 'error',
              message: `행 ${i + 1}: 컬럼 '${key}'은(는) NULL일 수 없습니다.`,
              column: key,
              row: i + 1
            });
          }

          // 타입 체크 (기본적인 검증)
          if (value !== null && value !== '') {
            if (column.data_type === 'integer' && isNaN(Number(value))) {
              errors.push({
                type: 'error',
                message: `행 ${i + 1}: 컬럼 '${key}'은(는) 정수여야 합니다.`,
                column: key,
                row: i + 1
              });
            }
            if (column.data_type === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value))) {
              errors.push({
                type: 'error',
                message: `행 ${i + 1}: 컬럼 '${key}'은(는) 올바른 UUID 형식이어야 합니다.`,
                column: key,
                row: i + 1
              });
            }
          }
        }
      }

      // 4. FK 체크
      for (const fk of tableSchema.foreign_keys) {
        if (!headers.includes(fk.column_name)) {
          warnings.push({
            type: 'warning',
            message: `FK 컬럼 '${fk.column_name}'이(가) 누락되었습니다. ${fk.foreign_table} 테이블을 먼저 업로드해야 합니다.`,
            column: fk.column_name
          });
        }
      }

      // 테이블별 파일 그룹화
      if (!tableFiles[tableName]) {
        tableFiles[tableName] = [];
      }
      tableFiles[tableName].push(fileName);

      results.push({
        fileName,
        tableName,
        isValid: errors.length === 0,
        errors,
        warnings
      });
    }

    // 업로드 순서 계산 (위상 정렬)
    const uploadOrder = calculateUploadOrder(schema, tableFiles);

    console.log('Validation complete');

    return new Response(
      JSON.stringify({
        success: true,
        results,
        uploadOrder,
        summary: {
          total: files.length,
          valid: results.filter(r => r.isValid).length,
          invalid: results.filter(r => !r.isValid).length,
          totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
          totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in validate-batch-files:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function calculateUploadOrder(schema: any, tableFiles: Record<string, string[]>): string[][] {
  const tables = Object.keys(tableFiles);
  const graph: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  // 그래프 초기화
  for (const table of tables) {
    graph[table] = [];
    inDegree[table] = 0;
  }

  // FK 관계에 따라 간선 추가
  for (const table of tables) {
    const tableSchema = schema[table];
    if (!tableSchema) continue;

    for (const fk of tableSchema.foreign_keys) {
      const refTable = fk.foreign_table;
      if (tables.includes(refTable) && refTable !== table) {
        graph[refTable].push(table);
        inDegree[table]++;
      }
    }
  }

  // 위상 정렬 (Kahn's Algorithm)
  const result: string[][] = [];
  const queue: string[] = [];

  // 진입 차수가 0인 노드를 큐에 추가
  for (const table of tables) {
    if (inDegree[table] === 0) {
      queue.push(table);
    }
  }

  while (queue.length > 0) {
    const currentLevel: string[] = [...queue];
    queue.length = 0;
    const levelFiles: string[] = [];

    for (const table of currentLevel) {
      levelFiles.push(...tableFiles[table]);
      for (const neighbor of graph[table]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    result.push(levelFiles);
  }

  // 순환 참조가 있는 경우 처리
  const remaining = tables.filter(t => inDegree[t] > 0);
  if (remaining.length > 0) {
    const remainingFiles = remaining.flatMap(t => tableFiles[t]);
    result.push(remainingFiles);
  }

  return result;
}
