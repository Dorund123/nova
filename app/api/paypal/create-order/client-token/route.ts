import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

export async function GET() {
  try {
    // Get PayPal credentials from Vercel/server environment variables
    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

    console.log("PayPal client token route called");

    // Check credentials
    if (!clientId || !clientSecret) {
      console.error("PayPal credentials are missing");

      console.error("PAYPAL_CLIENT_ID exists:", !!clientId);
      console.error(
        "PAYPAL_CLIENT_SECRET exists:",
        !!clientSecret
      );

      return NextResponse.json(
        {
          success: false,
          error: "PayPal credentials are missing",
        },
        {
          status: 500,
        }
      );
    }

    console.log("PayPal credentials found");

    // Create Basic Authentication header
    const auth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    // Request PayPal OAuth client token
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

    // Read response as text first
    const responseText = await response.text();

    console.log(
      "PayPal OAuth status:",
      response.status
    );

    let data: any = null;

    // Try to parse JSON
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "PayPal returned non-JSON response:",
        responseText.slice(0, 1000)
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal returned an invalid response",
        },
        {
          status: 502,
        }
      );
    }

    // PayPal authentication failed
    if (!response.ok) {
      console.error(
        "PayPal OAuth request failed:",
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
        {
          status: response.status,
        }
      );
    }

    // Make sure PayPal returned a token
    if (!data?.access_token) {
      console.error(
        "PayPal response did not contain access_token:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal did not return a client token",
        },
        {
          status: 502,
        }
      );
    }

    console.log(
      "PayPal client token created successfully"
    );

    // Send the token to the browser
    return NextResponse.json(
      {
        success: true,
        clientToken: data.access_token,
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
      "PayPal client token route error:",
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
      {
        status: 500,
      }
    );
  }
}