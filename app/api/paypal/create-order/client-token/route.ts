import { NextResponse } from "next/server";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const auth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const text = await response.text();

  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `PayPal token response was not JSON: ${text.slice(0, 500)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        "Failed to get PayPal access token"
    );
  }

  return data.access_token;
}

export async function GET() {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v1/identity/generate-token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "PayPal returned a non-JSON response",
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error_description ||
            data?.error ||
            "Failed to generate PayPal client token",
        },
        { status: response.status }
      );
    }

    if (!data?.client_token) {
      return NextResponse.json(
        {
          error: "PayPal did not return a client token",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      clientToken: data.client_token,
    });
  } catch (error) {
    console.error("PayPal client token error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create PayPal client token",
      },
      { status: 500 }
    );
  }
}