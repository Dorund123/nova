import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYPAL_API = "https://api-m.paypal.com";

export async function GET() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      console.error("PayPal credentials are missing");

      return NextResponse.json(
        {
          success: false,
          error: "PayPal credentials are missing",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      `${PAYPAL_API}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          "grant_type=client_credentials&response_type=client_token&intent=sdk_init",
        cache: "no-store",
      }
    );

    const rawText = await tokenResponse.text();

    let paypalData: any = {};

    try {
      paypalData = JSON.parse(rawText);
    } catch {
      paypalData = {
        raw: rawText,
      };
    }

    console.log(
      "PayPal client-token response status:",
      tokenResponse.status
    );

    if (!tokenResponse.ok) {
      console.error(
        "PayPal client-token request failed:",
        paypalData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            paypalData?.error_description ||
            paypalData?.error ||
            "Client Authentication failed",
        },
        {
          status: tokenResponse.status,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const accessToken = paypalData?.access_token;

    if (!accessToken) {
      console.error(
        "PayPal did not return access_token:",
        paypalData
      );

      return NextResponse.json(
        {
          success: false,
          error: "PayPal did not return a client token.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        // Card Fields uses this as clientToken
        clientToken: accessToken,

        // Kept too for compatibility
        accessToken,

        expiresIn: paypalData?.expires_in ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Client token route crashed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create PayPal client token.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}