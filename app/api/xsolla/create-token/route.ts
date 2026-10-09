
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACKAGES: Record<number, string> = {
  300: "novux-300",
  1000: "novux-1000",
  1500: "novux-1500",
  2500: "novux-2500",
  5000: "novux-5000",
  10000: "novux-10000",
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Please log in first." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const projectId = process.env.XSOLLA_PROJECT_ID;
    const apiKey = process.env.XSOLLA_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !projectId || !apiKey) {
      console.error("Missing required Supabase or Xsolla environment variables.");

      return NextResponse.json(
        { success: false, error: "Payment server is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Your session is invalid. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const sku = PACKAGES[amount];

    if (!sku) {
      return NextResponse.json(
        { success: false, error: "Invalid Novux package." },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const auth = Buffer.from(`${projectId}:${apiKey}`).toString("base64");

    const xsollaResponse = await fetch(
      "https://store.xsolla.com/api/v2/project/" +
        encodeURIComponent(projectId) +
        "/user/" +
        encodeURIComponent(user.id) +
        "/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          settings: {
            currency: "USD",
            language: "en",
            return_url: origin,
          },
          purchase: {
            items: [
              {
                sku,
                quantity: 1,
              },
            ],
          },
          user: {
            id: {
              value: user.id,
            },
          },
        }),
        cache: "no-store",
      }
    );

    const raw = await xsollaResponse.text();
    let result: any;

    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      result = {};
    }

    if (!xsollaResponse.ok) {
      console.error("Xsolla token request failed:", xsollaResponse.status, raw);

      return NextResponse.json(
        {
          success: false,
          error:
            result?.errorMessage ||
            result?.message ||
            "Xsolla could not create a checkout session.",
        },
        { status: 502 }
      );
    }

    const token = result?.token;

    if (!token) {
      console.error("Xsolla response did not contain a token:", raw);

      return NextResponse.json(
        { success: false, error: "Xsolla did not return a checkout token." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl:
        `https://store.xsolla.com/?token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    console.error("Xsolla create-token error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to start checkout." },
      { status: 500 }
    );
  }
}
