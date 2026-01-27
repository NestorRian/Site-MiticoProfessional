// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GA4_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID") || "";
const GA4_CLIENT_EMAIL = Deno.env.get("GA4_CLIENT_EMAIL") || "";
const GA4_PRIVATE_KEY = (Deno.env.get("GA4_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
const GA4_CRON_SECRET = Deno.env.get("GA4_CRON_SECRET") || "";

const GA4_CACHE_TABLE = "ga4_dashboard_cache";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });
}

function errorResponse(message: string, status = 400) {
    return jsonResponse({ error: message }, status);
}

function pemToArrayBuffer(pem: string) {
    const base64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function importPrivateKey(pem: string) {
    return await crypto.subtle.importKey(
        "pkcs8",
        pemToArrayBuffer(pem),
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );
}

async function getAccessToken() {
    if (!GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
        throw new Error("Credenciais GA4 nao configuradas.");
    }

    const key = await importPrivateKey(GA4_PRIVATE_KEY);
    const jwt = await create(
        { alg: "RS256", typ: "JWT" },
        {
            iss: GA4_CLIENT_EMAIL,
            scope: "https://www.googleapis.com/auth/analytics.readonly",
            aud: "https://oauth2.googleapis.com/token",
            exp: getNumericDate(60 * 60),
            iat: getNumericDate(0),
        },
        key
    );

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token GA4 falhou: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token as string;
}

function formatDate(value: Date) {
    return value.toISOString().slice(0, 10);
}

function formatGaDate(value: string) {
    if (!value || value.length !== 8) {
        return value;
    }
    return `${value.slice(6, 8)}/${value.slice(4, 6)}`;
}

function toNumber(value: string | undefined) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchGa4Reports(accessToken: string, startDate: string, endDate: string) {
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:batchRunReports`;

    const requests = [
        {
            dateRanges: [{ startDate, endDate }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        },
        {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "screenPageViews" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
        },
        {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { matchType: "EXACT", value: "view_item" },
                },
            },
            orderBys: [{ dimension: { dimensionName: "date" } }],
        },
        {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { matchType: "EXACT", value: "add_to_cart" },
                },
            },
            orderBys: [{ dimension: { dimensionName: "date" } }],
        },
        {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "itemName" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { matchType: "EXACT", value: "view_item" },
                },
            },
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 5,
        },
        {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "itemName" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
                filter: {
                    fieldName: "eventName",
                    stringFilter: { matchType: "EXACT", value: "add_to_cart" },
                },
            },
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 5,
        },
        {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "city" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 5,
        },
    ];

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GA4 runReport falhou: ${errorText}`);
    }

    return await response.json();
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return errorResponse("Metodo nao permitido.", 405);
    }

    if (!GA4_CRON_SECRET || req.headers.get("x-cron-key") !== GA4_CRON_SECRET) {
        return errorResponse("Nao autorizado.", 401);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return errorResponse("Supabase nao configurado.", 500);
    }

    if (!GA4_PROPERTY_ID) {
        return errorResponse("GA4_PROPERTY_ID nao configurado.", 500);
    }

    let days = 30;
    try {
        const body = await req.json();
        const requested = Number(body?.days);
        if (Number.isFinite(requested) && requested > 0) {
            days = Math.min(365, Math.round(requested));
        }
    } catch (_error) {
        days = 30;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));

    try {
        const accessToken = await getAccessToken();
        const reportData = await fetchGa4Reports(
            accessToken,
            formatDate(startDate),
            formatDate(endDate)
        );

        const reports = reportData.reports || [];

        const summaryRow = reports[0]?.rows?.[0];
        const summary = {
            activeUsers: toNumber(summaryRow?.metricValues?.[0]?.value),
            screenPageViews: toNumber(summaryRow?.metricValues?.[1]?.value),
        };

        const buildSeries = (reportIndex: number) => {
            const rows = reports[reportIndex]?.rows || [];
            return {
                labels: rows.map((row: { dimensionValues: { value: string }[] }) =>
                    formatGaDate(row.dimensionValues?.[0]?.value)
                ),
                values: rows.map((row: { metricValues: { value: string }[] }) =>
                    toNumber(row.metricValues?.[0]?.value)
                ),
            };
        };

        const buildTopList = (reportIndex: number) => {
            const rows = reports[reportIndex]?.rows || [];
            return rows
                .map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
                    const name = row.dimensionValues?.[0]?.value || "Produto";
                    return { name, total: toNumber(row.metricValues?.[0]?.value) };
                })
                .filter((item: { name: string }) => item.name && item.name !== "(not set)");
        };

        const buildGeoList = (reportIndex: number) => {
            const rows = reports[reportIndex]?.rows || [];
            return rows
                .map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
                    const name = row.dimensionValues?.[0]?.value || "";
                    return { name, total: toNumber(row.metricValues?.[0]?.value) };
                })
                .filter((item: { name: string }) => item.name && item.name !== "(not set)");
        };

        const payload = {
            summary,
            charts: {
                views: buildSeries(1),
                productViews: buildSeries(2),
                cart: buildSeries(3),
            },
            topViews: buildTopList(4),
            topCart: buildTopList(5),
            geo: buildGeoList(6),
            fetchedAt: new Date().toISOString(),
        };

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await supabase
            .from(GA4_CACHE_TABLE)
            .upsert({ id: "latest", payload, updated_at: new Date().toISOString() });

        if (error) {
            throw new Error(error.message);
        }

        return jsonResponse({ ok: true, updated_at: new Date().toISOString() });
    } catch (error) {
        console.error("Erro GA4 sync:", error);
        return errorResponse("Erro ao sincronizar GA4.", 500);
    }
});
