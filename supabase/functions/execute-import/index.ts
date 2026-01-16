// ============================================================================
// execute-import Edge Function
// ETL 실행 - 데이터 변환 및 타겟 테이블 저장
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExecuteRequest {
  session_id: string;
  column_mapping?: Record<string, string>;
  options?: {
    upsert?: boolean;
    batch_size?: number;
    skip_errors?: boolean;
  };
}

interface ExecuteResponse {
  success: boolean;
  status?: string;
  imported_rows?: number;
  failed_rows?: number;
  error_details?: Array<{
    batch_start: number;
    batch_end: number;
    error: string;
  }>;
  error?: string;
}

// 임포트 타입별 충돌 컬럼
const CONFLICT_COLUMNS: Record<string, string> = {
  products: "sku",
  customers: "email",
  staff: "staff_code",
  inventory: "product_id",
  transactions: "id",
};

// 데이터 변환 함수
function transformRow(
  row: Record<string, unknown>,
  mapping: Record<string, string>,
  importType: string,
  storeId: string | null,
  userId: string
): Record<string, unknown> {
  const transformed: Record<string, unknown> = {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // store_id가 있으면 추가
  if (storeId) {
    transformed.store_id = storeId;
  }

  // 매핑에 따라 필드 변환
  for (const [targetField, sourceField] of Object.entries(mapping)) {
    if (sourceField && row[sourceField] !== undefined) {
      transformed[targetField] = row[sourceField];
    }
  }

  // 타입별 추가 변환
  switch (importType) {
    case "products":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.price) {
        transformed.selling_price = Number(transformed.price) || 0;
        delete transformed.price;
      }
      if (transformed.stock !== undefined) {
        transformed.stock = Number(transformed.stock) || 0;
      }
      // sku 필드 매핑
      if (transformed.sku === undefined && transformed.product_code) {
        transformed.sku = transformed.product_code;
        delete transformed.product_code;
      }
      // product_name -> name
      if (transformed.product_name && !transformed.name) {
        transformed.name = transformed.product_name;
      }
      break;

    case "customers":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.total_purchases) {
        transformed.total_purchases = Number(transformed.total_purchases) || 0;
      }
      // customer_name -> name
      if (transformed.customer_name && !transformed.name) {
        transformed.name = transformed.customer_name;
      }
      break;

    case "staff":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      // staff_name -> name
      if (transformed.staff_name && !transformed.name) {
        transformed.name = transformed.staff_name;
      }
      break;

    case "transactions":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.total_amount) {
        transformed.total_amount = Number(transformed.total_amount) || 0;
      }
      if (transformed.transaction_date) {
        transformed.transaction_date = new Date(
          transformed.transaction_date as string
        ).toISOString();
      }
      break;

    case "inventory":
      transformed.id = transformed.id || crypto.randomUUID();
      transformed.user_id = userId;
      if (transformed.quantity !== undefined) {
        transformed.quantity = Number(transformed.quantity) || 0;
      }
      if (transformed.min_stock !== undefined) {
        transformed.min_stock = Number(transformed.min_stock) || 0;
      }
      if (transformed.max_stock !== undefined) {
        transformed.max_stock = Number(transformed.max_stock) || 0;
      }
      break;
  }

  return transformed;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 인증 확인
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // 요청 파싱
    const { session_id, column_mapping, options }: ExecuteRequest =
      await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    const batchSize = options?.batch_size || 100;
    const skipErrors = options?.skip_errors ?? true;

    console.log(`🚀 Executing import for session: ${session_id}`);

    // 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from("upload_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found");
    }

    // 권한 확인
    if (session.user_id !== user.id) {
      throw new Error("Access denied");
    }

    // 매핑 결정 (요청에서 받은 것 또는 세션에 저장된 것)
    const finalMapping = column_mapping || session.column_mapping || {};

    // raw_imports에서 원본 데이터 조회
    const { data: rawImport, error: rawError } = await supabase
      .from("raw_imports")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (rawError || !rawImport) {
      throw new Error("Raw import data not found");
    }

    const rawData = rawImport.raw_data as Record<string, unknown>[];

    // 세션 상태 업데이트
    await supabase
      .from("upload_sessions")
      .update({
        status: "importing",
        column_mapping: finalMapping,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // user_data_imports 기록 생성
    const { data: importRecord, error: importRecordError } = await supabase
      .from("user_data_imports")
      .insert({
        session_id,
        user_id: user.id,
        org_id: session.org_id,
        store_id: session.store_id,
        import_type: session.import_type,
        target_table: session.target_table,
        file_name: session.file_name,
        total_rows: rawData.length,
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (importRecordError) {
      console.error("Import record creation error:", importRecordError);
    }

    // 배치 임포트 실행
    const targetTable = session.target_table;
    const importType = session.import_type;
    const conflictColumn = CONFLICT_COLUMNS[importType] || "id";

    let importedRows = 0;
    let failedRows = 0;
    const errorDetails: Array<{
      batch_start: number;
      batch_end: number;
      error: string;
    }> = [];

    console.log(
      `📊 Processing ${rawData.length} rows in batches of ${batchSize}`
    );

    for (let i = 0; i < rawData.length; i += batchSize) {
      const batch = rawData.slice(i, i + batchSize);
      const transformedBatch = batch.map((row) =>
        transformRow(row, finalMapping, importType, session.store_id, user.id)
      );

      try {
        // 타겟 테이블에 upsert
        const { error: upsertError } = await supabase
          .from(targetTable)
          .upsert(transformedBatch, {
            onConflict: conflictColumn,
            ignoreDuplicates: false,
          });

        if (upsertError) {
          throw upsertError;
        }

        importedRows += transformedBatch.length;
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1}: ${transformedBatch.length} rows imported`
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`❌ Batch error at ${i}:`, errorMessage);

        if (skipErrors) {
          failedRows += batch.length;
          errorDetails.push({
            batch_start: i,
            batch_end: i + batch.length,
            error: errorMessage,
          });
        } else {
          throw err;
        }
      }

      // 진행 상황 업데이트
      if (importRecord) {
        await supabase
          .from("user_data_imports")
          .update({
            imported_rows: importedRows,
            failed_rows: failedRows,
            progress: {
              current: i + batch.length,
              total: rawData.length,
              percentage: Math.round(((i + batch.length) / rawData.length) * 100),
            },
          })
          .eq("id", importRecord.id);
      }
    }

    // 최종 상태 결정
    const finalStatus =
      failedRows === 0
        ? "completed"
        : failedRows < rawData.length
        ? "partial"
        : "failed";

    // 임포트 기록 완료 업데이트
    if (importRecord) {
      await supabase
        .from("user_data_imports")
        .update({
          status: finalStatus,
          imported_rows: importedRows,
          failed_rows: failedRows,
          error_details: errorDetails.length > 0 ? errorDetails : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importRecord.id);
    }

    // 세션 완료 업데이트
    await supabase
      .from("upload_sessions")
      .update({
        status: finalStatus,
        completed_files: finalStatus === "completed" ? 1 : 0,
        failed_files: finalStatus === "failed" ? 1 : 0,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // raw_imports 상태 업데이트
    await supabase
      .from("raw_imports")
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", rawImport.id);

    console.log(
      `✅ Import complete: ${importedRows} imported, ${failedRows} failed`
    );

    const response: ExecuteResponse = {
      success: true,
      status: finalStatus,
      imported_rows: importedRows,
      failed_rows: failedRows,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Execute import error:", errorMessage);

    const response: ExecuteResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
