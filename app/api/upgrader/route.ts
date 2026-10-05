import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // ========================================
    // REQUEST
    // ========================================

    const body = await request.json();

    const bet = Number(body.bet);
    const chance = Number(body.chance);

    console.log("🔥 UPGRADER INPUT:", {
      bet,
      chance,
    });

    // ========================================
    // VALIDATION
    // ========================================

    if (!Number.isFinite(bet) || bet <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bet.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(bet)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bet must be a whole number.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(chance) ||
      chance <= 0 ||
      chance >= 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Chance must be between 0 and 100.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // SUPABASE ENV
    // ========================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("🔥 SUPABASE ENV:", {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
    });

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase configuration is missing.",
        },
        { status: 500 }
      );
    }

    // ========================================
    // AUTHORIZATION
    // ========================================

    const authHeader =
      request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authorization required.",
        },
        { status: 401 }
      );
    }

    const token =
      authHeader.slice(7).trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Access token missing.",
        },
        { status: 401 }
      );
    }

    console.log(
      "✅ ACCESS TOKEN RECEIVED"
    );

    // ========================================
    // SUPABASE CLIENT
    // ========================================

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // ========================================
    // CHECK USER
    // ========================================

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      console.error(
        "❌ AUTH ERROR:",
        userError?.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired Supabase session.",
        },
        { status: 401 }
      );
    }

    console.log(
      "✅ USER AUTHENTICATED:",
      userData.user.id
    );

    // ========================================
    // CALL SQL RPC
    // ========================================

    console.log(
      "🔥 CALLING play_upgrader RPC..."
    );

    const {
      data,
      error: rpcError,
    } =
      await supabase.rpc(
        "play_upgrader",
        {
          p_bet: bet,
          p_chance: chance,
        }
      );

    if (rpcError) {
      console.error(
        "❌ UPGRADER RPC ERROR:",
        rpcError.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            rpcError.message ||
            "Could not play Upgrader.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.error(
        "❌ RPC RETURNED NO DATA"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Upgrader returned no result.",
        },
        { status: 500 }
      );
    }

    console.log(
      "✅ UPGRADER RPC RESULT:",
      data
    );

    // ========================================
    // SUCCESS
    // ========================================

    return NextResponse.json(
      data,
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "❌ UPGRADER SERVER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Server error.",
      },
      { status: 500 }
    );
  }
}