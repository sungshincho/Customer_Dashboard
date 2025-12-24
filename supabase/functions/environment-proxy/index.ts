import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WeatherRequest = {
  type: "weather";
  lat: number;
  lon: number;
};

type HolidaysRequest = {
  type: "holidays";
  year: number;
  month: number;
  countryCode?: string;
};

type RequestBody = WeatherRequest | HolidaysRequest;

function getEnv(...keys: string[]) {
  for (const k of keys) {
    const v = Deno.env.get(k);
    if (v) return v;
  }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Partial<RequestBody>;

    if (body.type === "weather") {
      const apiKey = getEnv("OPENWEATHERMAP_API_KEY", "VITE_OPENWEATHERMAP_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing OPENWEATHERMAP_API_KEY" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lat = Number((body as WeatherRequest).lat);
      const lon = Number((body as WeatherRequest).lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return new Response(
          JSON.stringify({ error: "lat/lon are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = new URL("https://api.openweathermap.org/data/2.5/weather");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("appid", apiKey);
      url.searchParams.set("units", "metric");
      url.searchParams.set("lang", "kr");

      const res = await fetch(url.toString());
      const text = await res.text();
      if (!res.ok) {
        return new Response(text, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": res.headers.get("content-type") ?? "text/plain" },
        });
      }

      return new Response(text, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "holidays") {
      const apiKey = getEnv("DATA_GO_KR_API_KEY", "VITE_DATA_GO_KR_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing DATA_GO_KR_API_KEY" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const countryCode = (body as HolidaysRequest).countryCode ?? "KR";
      if (countryCode !== "KR") {
        return new Response(
          JSON.stringify({ error: "Only KR holidays are supported" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const year = Number((body as HolidaysRequest).year);
      const month = Number((body as HolidaysRequest).month);
      if (!Number.isFinite(year) || !Number.isFinite(month)) {
        return new Response(
          JSON.stringify({ error: "year/month are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = new URL(
        "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
      );
      url.searchParams.set("serviceKey", apiKey);
      url.searchParams.set("solYear", String(year));
      url.searchParams.set("solMonth", String(month).padStart(2, "0"));
      url.searchParams.set("_type", "json");

      const res = await fetch(url.toString());
      const text = await res.text();
      if (!res.ok) {
        return new Response(text, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": res.headers.get("content-type") ?? "text/plain" },
        });
      }

      return new Response(text, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid request type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("environment-proxy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
