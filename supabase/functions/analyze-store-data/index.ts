import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisType, data, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch user's imported data for context
    let historicalContext = "";
    if (userId) {
      console.log(`Fetching imported data for user: ${userId}`);
      
      // Map analysis types to relevant data types
      const dataTypeMapping: Record<string, string[]> = {
        "traffic-heatmap": ["traffic", "customer"],
        "conversion-funnel": ["sales", "customer", "transaction"],
        "customer-journey": ["customer", "traffic"],
        "product-performance": ["sales", "product", "inventory"],
        "demand-forecast": ["sales", "product", "inventory", "traffic"],
        "layout-simulator": ["traffic", "customer", "sales"],
        "inventory-optimizer": ["inventory", "product", "sales"],
      };

      const relevantDataTypes = dataTypeMapping[analysisType] || ["sales", "customer", "inventory", "traffic"];
      
      const { data: importedData, error: importError } = await supabase
        .from("user_data_imports")
        .select("data_type, raw_data, row_count, created_at, file_name")
        .eq("user_id", userId)
        .in("data_type", relevantDataTypes)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!importError && importedData && importedData.length > 0) {
        console.log(`Found ${importedData.length} relevant imported datasets`);
        
        // Summarize historical data for AI context
        const dataSummaries = importedData.map(item => {
          const sampleData = Array.isArray(item.raw_data) 
            ? item.raw_data.slice(0, 3) 
            : [item.raw_data];
          
          return `
데이터 타입: ${item.data_type}
파일명: ${item.file_name}
데이터 행 수: ${item.row_count}
업로드 일시: ${new Date(item.created_at).toLocaleDateString('ko-KR')}
샘플 데이터: ${JSON.stringify(sampleData, null, 2)}
          `.trim();
        }).join('\n\n---\n\n');

        historicalContext = `\n\n## 고객사 임포트 데이터 컨텍스트\n아래는 고객이 이전에 업로드한 실제 비즈니스 데이터입니다. 이 과거 데이터를 참고하여 더욱 정확하고 맞춤화된 분석을 제공하세요:\n\n${dataSummaries}\n\n위 데이터의 패턴과 트렌드를 고려하여 분석하세요.`;
      } else {
        console.log("No relevant imported data found or error occurred:", importError);
      }
    }

    let systemPrompt = "";
    
    switch (analysisType) {
      case "traffic-heatmap":
        systemPrompt = "당신은 매장 레이아웃 최적화 전문가입니다. 트래픽 히트맵 데이터를 분석하여 최적의 상품 배치와 레이아웃 개선안을 제안하세요. 고객사의 과거 데이터 패턴을 참고하여 구체적이고 실행 가능한 3-5개의 제안을 해주세요.";
        break;
      case "conversion-funnel":
        systemPrompt = "당신은 전환율 최적화 전문가입니다. 고객의 매장 내 전환 퍼널 데이터를 분석하여 각 단계별 이탈을 줄이고 전환율을 높이는 구체적인 방법을 제안하세요. 고객사의 과거 거래 및 고객 데이터를 고려하세요.";
        break;
      case "customer-journey":
        systemPrompt = "당신은 고객 경험 최적화 전문가입니다. 고객 동선 데이터를 분석하여 매장 내 고객 경험을 개선하고 구매 전환율을 높이는 방법을 제안하세요. 고객사의 과거 고객 행동 패턴을 활용하세요.";
        break;
      case "product-performance":
        systemPrompt = "당신은 상품 관리 및 머천다이징 전문가입니다. 상품별 판매 데이터를 분석하여 재고 관리, 진열 전략, 프로모션 계획을 제안하세요. 고객사의 과거 판매 및 재고 데이터를 참고하세요.";
        break;
      case "demand-forecast":
        systemPrompt = "당신은 수요 예측 전문가입니다. 과거 데이터와 외부 요인을 고려하여 미래 수요를 예측하고 준비해야 할 사항을 제안하세요. 고객사의 과거 판매 추세와 재고 회전율을 분석에 반영하세요.";
        break;
      case "layout-simulator":
        systemPrompt = "당신은 매장 레이아웃 시뮬레이션 전문가입니다. 다양한 레이아웃 옵션을 분석하여 최적의 레이아웃과 그 효과를 예측하세요. 고객사의 과거 트래픽 데이터와 판매 패턴을 고려하세요.";
        break;
      case "inventory-optimizer":
        systemPrompt = "당신은 재고 최적화 전문가입니다. 판매 데이터와 재고 수준을 분석하여 최적의 재고 수준과 발주 시점을 제안하세요. 고객사의 과거 재고 및 판매 데이터를 기반으로 하세요.";
        break;
      default:
        systemPrompt = "당신은 매장 분석 전문가입니다. 제공된 데이터를 분석하여 실행 가능한 인사이트를 제공하세요. 고객사의 과거 데이터를 참고하여 맞춤형 제안을 하세요.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `다음은 현재 분석할 데이터입니다:\n\n${JSON.stringify(data, null, 2)}${historicalContext}\n\n위의 현재 데이터와 과거 임포트된 데이터를 종합적으로 분석하여, 구체적이고 실행 가능한 인사이트를 한국어로 제공해주세요. 과거 데이터의 패턴과 트렌드를 현재 분석에 반영하세요.` 
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "크레딧이 부족합니다. Lovable 워크스페이스에 크레딧을 추가해주세요." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI 분석 요청 실패");
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("분석 오류:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "분석 중 오류가 발생했습니다" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
