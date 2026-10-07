import { NextResponse } from "next/server";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

export async function GET() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "PayPal credentials are missing",
        },
        { status: 500 }
      );
    }

    const auth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    // PayPal browser-safe client token
    const response = await fetch(
      `${PAYPAL_API}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body:
          "grant_type=client_credentials&response_type=client_token&intent=sdk_init",
        cache: "no-store",
      }
    );

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      console.error(
        "PayPal OAuth non-JSON:",
        text.slice(0, 500)
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal returned a non-JSON response",
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(
        "PayPal OAuth failed:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          error:
            data?.error_description ||
            data?.error ||
            "PayPal authentication failed",
        },
        { status: response.status }
      );
    }

    if (!data?.access_token) {
      console.error(
        "PayPal did not return access_token:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal did not return a client token",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      clientToken: data.access_token,
    });
  } catch (error) {
    console.error(
      "PayPal client token error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create PayPal client token",
      },
      { status: 500 }
    );
  }
}