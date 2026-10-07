import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

/*
=========================================================
NOVUX PACKAGES
=========================================================
*/

const PACKAGES: Record<
  number,
  {
    novux: number;
    price: number;
  }
> = {
  300: {
    novux: 300,
    price: 3,
  },

  1000: {
    novux: 1000,
    price: 7,
  },

  1500: {
    novux: 1500,
    price: 9,
  },

  2500: {
    novux: 2500,
    price: 15,
  },

  5000: {
    novux: 5000,
    price: 25,
  },

  10000: {
    novux: 10000,
    price: 45,
  },
};

/*
=========================================================
SUPABASE ADMIN CLIENT
=========================================================
*/

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/*
=========================================================
SAFE RESPONSE READER
=========================================================
*/

async function readResponse(
  response: Response
) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(
      "Non-JSON response:",
      text.slice(0, 1000)
    );

    return {
      raw: text,
    };
  }
}

/*
=========================================================
GET PAYPAL ACCESS TOKEN
=========================================================
*/

async function getPayPalAccessToken() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID;

  const clientSecret =
    process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing."
    );
  }

  const auth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_API}/v1/oauth2/token`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Basic ${auth}`,

        "Content-Type":
          "application/x-www-form-urlencoded",

        Accept:
          "application/json",
      },

      body:
        "grant_type=client_credentials",

      cache: "no-store",
    }
  );

  const data =
    await readResponse(response);

  if (!response.ok) {
    console.error(
      "PayPal authentication failed:",
      data
    );

    throw new Error(
      "Could not authenticate with PayPal."
    );
  }

  if (
    !data ||
    typeof data.access_token !==
      "string"
  ) {
    throw new Error(
      "PayPal did not return an access token."
    );
  }

  return data.access_token;
}

/*
=========================================================
GET AUTHENTICATED USER
=========================================================
*/

async function getAuthenticatedUser(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    throw new Error(
      "Authorization header is missing or invalid."
    );
  }

  const accessToken =
    authorization
      .substring(7)
      .trim();

  if (!accessToken) {
    throw new Error(
      "Access token is missing."
    );
  }

  const supabase =
    getSupabaseAdmin();

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(
      accessToken
    );

  if (error || !user) {
    console.error(
      "Supabase authentication error:",
      error
    );

    throw new Error(
      "Your login session is invalid or expired."
    );
  }

  return user;
}

/*
=========================================================
CREATE PAYPAL ORDER
=========================================================
*/

async function createPayPalOrder(
  novux: number
) {
  /*
  =======================================================
  CHECK PACKAGE
  =======================================================
  */

  const packageData =
    PACKAGES[novux];

  if (!packageData) {
    throw new Error(
      "This Novux package does not exist."
    );
  }

  /*
  =======================================================
  GET PAYPAL TOKEN
  =======================================================
  */

  const accessToken =
    await getPayPalAccessToken();

  /*
  =======================================================
  IMPORTANT PACKAGE IDENTIFIER
  =======================================================
  */

  const customId =
    `novux_${packageData.novux}`;

  const referenceId =
    `nova-novux-${packageData.novux}`;

  /*
  =======================================================
  CREATE PAYPAL ORDER
  =======================================================
  */

  const orderResponse =
    await fetch(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "PayPal-Request-Id":
            `nova-${novux}-${Date.now()}`,
        },

        body: JSON.stringify({
          intent: "CAPTURE",

          purchase_units: [
            {
              reference_id:
                referenceId,

              custom_id:
                customId,

              description:
                `${packageData.novux.toLocaleString()} Novux`,

              amount: {
                currency_code:
                  "USD",

                value:
                  packageData.price.toFixed(
                    2
                  ),
              },
            },
          ],
        }),

        cache: "no-store",
      }
    );

  /*
  =======================================================
  READ PAYPAL RESPONSE
  =======================================================
  */

  const orderData =
    await readResponse(
      orderResponse
    );

  /*
  =======================================================
  CHECK PAYPAL RESPONSE
  =======================================================
  */

  if (!orderResponse.ok) {
    console.error(
      "PayPal create order failed:",
      {
        status:
          orderResponse.status,

        statusText:
          orderResponse.statusText,

        data:
          orderData,
      }
    );

    throw new Error(
      "PayPal could not create the order."
    );
  }

  /*
  =======================================================
  CHECK ORDER ID
  =======================================================
  */

  if (
    !orderData ||
    typeof orderData.id !==
      "string"
  ) {
    console.error(
      "PayPal order ID missing:",
      orderData
    );

    throw new Error(
      "PayPal did not return an order ID."
    );
  }

  /*
  =======================================================
  LOG ORDER
  =======================================================
  */

  console.log(
    "================================="
  );

  console.log(
    "PAYPAL ORDER CREATED"
  );

  console.log(
    "Order ID:",
    orderData.id
  );

  console.log(
    "Novux:",
    packageData.novux
  );

  console.log(
    "Price:",
    packageData.price
  );

  console.log(
    "Custom ID:",
    customId
  );

  console.log(
    "Reference ID:",
    referenceId
  );

  console.log(
    "================================="
  );

  /*
  =======================================================
  RETURN
  =======================================================
  */

  return {
    orderID:
      orderData.id,

    novux:
      packageData.novux,

    price:
      packageData.price,

    currency:
      "USD",

    customID:
      customId,

    referenceID:
      referenceId,
  };
}

/*
=========================================================
CAPTURE PAYPAL ORDER
=========================================================
*/

async function capturePayPalOrder(
  request: Request,
  orderID: string
) {
  /*
  =======================================================
  1. AUTHENTICATE USER
  =======================================================
  */

  const user =
    await getAuthenticatedUser(
      request
    );

  /*
  =======================================================
  2. VALIDATE ORDER ID
  =======================================================
  */

  if (
    !orderID ||
    typeof orderID !==
      "string"
  ) {
    throw new Error(
      "PayPal order ID is missing."
    );
  }

  /*
  =======================================================
  3. GET PAYPAL TOKEN
  =======================================================
  */

  const accessToken =
    await getPayPalAccessToken();

  /*
  =======================================================
  4. GET ORDER BEFORE CAPTURE
  =======================================================
  */

  const orderResponse =
    await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(
        orderID
      )}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },

        cache: "no-store",
      }
    );

  const orderData =
    await readResponse(
      orderResponse
    );

  if (!orderResponse.ok) {
    console.error(
      "PayPal order lookup failed:",
      orderData
    );

    throw new Error(
      "Could not find the PayPal order."
    );
  }

  /*
  =======================================================
  5. FIND PURCHASE UNIT
  =======================================================
  */

  const purchaseUnit =
    Array.isArray(
      orderData?.purchase_units
    )
      ? orderData.purchase_units[0]
      : null;

  if (!purchaseUnit) {
    throw new Error(
      "PayPal purchase information is missing."
    );
  }

  /*
  =======================================================
  6. READ CUSTOM ID
  =======================================================
  */

  const customID =
    purchaseUnit?.custom_id;

  console.log(
    "PayPal order custom_id:",
    customID
  );

  /*
  =======================================================
  7. VALIDATE CUSTOM ID
  =======================================================
  */

  if (
    typeof customID !==
      "string" ||
    !customID.startsWith(
      "novux_"
    )
  ) {
    console.error(
      "Invalid PayPal custom_id:",
      {
        customID,
        orderData,
      }
    );

    throw new Error(
      "Invalid Novux package."
    );
  }

  /*
  =======================================================
  8. GET NOVUX AMOUNT
  =======================================================
  */

  const novuxText =
    customID.substring(
      "novux_".length
    );

  const novux =
    Number(novuxText);

  /*
  =======================================================
  9. VALIDATE PACKAGE
  =======================================================
  */

  const packageData =
    PACKAGES[novux];

  if (
    !Number.isFinite(novux) ||
    !packageData
  ) {
    console.error(
      "Invalid Novux package:",
      {
        customID,
        novux,
      }
    );

    throw new Error(
      "Invalid Novux package."
    );
  }

  /*
  =======================================================
  10. VERIFY ORDER AMOUNT
  =======================================================
  */

  const orderAmount =
    Number(
      purchaseUnit?.amount?.value
    );

  const orderCurrency =
    purchaseUnit
      ?.amount
      ?.currency_code;

  if (
    !Number.isFinite(
      orderAmount
    ) ||
    orderAmount !==
      packageData.price
  ) {
    console.error(
      "PayPal order amount mismatch:",
      {
        orderAmount,
        expected:
          packageData.price,
        novux,
      }
    );

    throw new Error(
      "Payment amount does not match the selected Novux package."
    );
  }

  if (
    orderCurrency !==
    "USD"
  ) {
    throw new Error(
      "Invalid payment currency."
    );
  }

  /*
  =======================================================
  11. CAPTURE ORDER
  =======================================================
  */

  const captureResponse =
    await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(
        orderID
      )}/capture`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "PayPal-Request-Id":
            `capture-${orderID}`,
        },

        body:
          JSON.stringify({}),

        cache: "no-store",
      }
    );

  const captureData =
    await readResponse(
      captureResponse
    );

  /*
  =======================================================
  12. CAPTURE ERROR
  =======================================================
  */

  if (!captureResponse.ok) {
    console.error(
      "PayPal capture failed:",
      {
        status:
          captureResponse.status,

        data:
          captureData,
      }
    );

    throw new Error(
      "PayPal payment could not be completed."
    );
  }

  /*
  =======================================================
  13. VERIFY CAPTURE STATUS
  =======================================================
  */

  if (
    captureData?.status !==
    "COMPLETED"
  ) {
    console.error(
      "PayPal capture status:",
      captureData
    );

    throw new Error(
      "PayPal payment was not completed."
    );
  }

  /*
  =======================================================
  14. FIND CAPTURE
  =======================================================
  */

  const capturedPurchaseUnit =
    Array.isArray(
      captureData?.purchase_units
    )
      ? captureData.purchase_units[0]
      : null;

  const capture =
    Array.isArray(
      capturedPurchaseUnit
        ?.payments
        ?.captures
    )
      ? capturedPurchaseUnit
          .payments
          .captures[0]
      : null;

  if (!capture) {
    throw new Error(
      "PayPal capture information is missing."
    );
  }

  /*
  =======================================================
  15. VERIFY CAPTURE
  =======================================================
  */

  if (
    capture.status !==
    "COMPLETED"
  ) {
    throw new Error(
      "PayPal capture was not completed."
    );
  }

  const paidAmount =
    Number(
      capture?.amount?.value
    );

  const paidCurrency =
    capture
      ?.amount
      ?.currency_code;

  if (
    paidAmount !==
    packageData.price
  ) {
    console.error(
      "Capture amount mismatch:",
      {
        paidAmount,
        expected:
          packageData.price,
        novux,
      }
    );

    throw new Error(
      "Invalid payment amount."
    );
  }

  if (
    paidCurrency !==
    "USD"
  ) {
    throw new Error(
      "Invalid payment currency."
    );
  }

  /*
  =======================================================
  16. SUPABASE
  =======================================================
  */

  const supabase =
    getSupabaseAdmin();

  /*
  =======================================================
  17. GET PROFILE
  =======================================================
  */

  const {
    data: profile,
    error:
      profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "id, username, novux_balance"
      )
      .eq(
        "id",
        user.id
      )
      .single();

  if (profileError) {
    console.error(
      "Profile error:",
      profileError
    );

    throw new Error(
      "Could not find your Nova profile."
    );
  }

  /*
  =======================================================
  18. CURRENT BALANCE
  =======================================================
  */

  const currentBalance =
    Number(
      profile?.novux_balance ??
        0
    );

  if (
    !Number.isFinite(
      currentBalance
    )
  ) {
    throw new Error(
      "Your current Novux balance is invalid."
    );
  }

  /*
  =======================================================
  19. NEW BALANCE
  =======================================================
  */

  const newBalance =
    currentBalance +
    packageData.novux;

  /*
  =======================================================
  20. UPDATE BALANCE
  =======================================================
  */

  const {
    data: updatedProfile,
    error:
      updateError,
  } =
    await supabase
      .from("profiles")
      .update({
        novux_balance:
          newBalance,
      })
      .eq(
        "id",
        user.id
      )
      .select(
        "id, username, novux_balance"
      )
      .single();

  if (updateError) {
    console.error(
      "Novux balance update error:",
      updateError
    );

    throw new Error(
      "Payment succeeded, but Novux could not be added to your account."
    );
  }

  /*
  =======================================================
  21. SUCCESS LOG
  =======================================================
  */

  console.log(
    "================================="
  );

  console.log(
    "NOVUX PURCHASE SUCCESS"
  );

  console.log(
    "User:",
    user.id
  );

  console.log(
    "Order:",
    orderID
  );

  console.log(
    "Capture:",
    capture.id
  );

  console.log(
    "Custom ID:",
    customID
  );

  console.log(
    "Novux:",
    packageData.novux
  );

  console.log(
    "Price:",
    packageData.price
  );

  console.log(
    "Old balance:",
    currentBalance
  );

  console.log(
    "New balance:",
    newBalance
  );

  console.log(
    "================================="
  );

  /*
  =======================================================
  22. RETURN
  =======================================================
  */

  return {
    success: true,

    orderID,

    captureID:
      capture.id,

    novux:
      packageData.novux,

    price:
      packageData.price,

    currency:
      "USD",

    previousBalance:
      currentBalance,

    newBalance,

    profile:
      updatedProfile,
  };
}

/*
=========================================================
POST
=========================================================
*/

export async function POST(
  request: Request
) {
  try {
    /*
    =====================================================
    READ JSON
    =====================================================
    */

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON request.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    VALIDATE BODY
    =====================================================
    */

    if (
      !body ||
      typeof body !==
        "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const requestBody =
      body as {
        action?: unknown;
        novux?: unknown;
        orderID?: unknown;
      };

    /*
    =====================================================
    ACTION
    =====================================================
    */

    const action =
      typeof requestBody.action ===
      "string"
        ? requestBody.action
        : "";

    /*
    =====================================================
    CREATE DETECTION
    =====================================================
    */

    const hasNovux =
      requestBody.novux !==
        undefined &&
      requestBody.novux !==
        null;

    /*
    =====================================================
    CAPTURE DETECTION
    =====================================================
    */

    const hasOrderID =
      typeof requestBody.orderID ===
        "string" &&
      requestBody.orderID.trim()
        .length > 0;

    /*
    =====================================================
    CREATE ORDER
    =====================================================
    */

    if (
      action ===
        "create-order" ||
      (!action &&
        hasNovux)
    ) {
      const novux =
        Number(
          requestBody.novux
        );

      if (
        !Number.isFinite(
          novux
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid Novux amount.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !PACKAGES[novux]
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This Novux package does not exist.",
          },
          {
            status: 400,
          }
        );
      }

      const result =
        await createPayPalOrder(
          novux
        );

      return NextResponse.json({
        success: true,

        orderID:
          result.orderID,

        novux:
          result.novux,

        price:
          result.price,

        currency:
          result.currency,

        customID:
          result.customID,

        referenceID:
          result.referenceID,
      });
    }

    /*
    =====================================================
    CAPTURE ORDER
    =====================================================
    */

    if (
      action ===
        "capture-order" ||
      (!action &&
        hasOrderID)
    ) {
      const orderID =
        typeof requestBody.orderID ===
        "string"
          ? requestBody.orderID.trim()
          : "";

      if (!orderID) {
        return NextResponse.json(
          {
            success: false,
            error:
              "PayPal order ID is missing.",
          },
          {
            status: 400,
          }
        );
      }

      const result =
        await capturePayPalOrder(
          request,
          orderID
        );

      return NextResponse.json(
        result
      );
    }

    /*
    =====================================================
    INVALID REQUEST
    =====================================================
    */

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid PayPal request. Send novux for create-order or orderID for capture-order.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "PAYPAL ROUTE ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Something went wrong with the PayPal payment.",
      },
      {
        status: 500,
      }
    );
  }
}