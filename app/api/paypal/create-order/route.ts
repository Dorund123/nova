import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYPAL_API =
  "https://api-m.sandbox.paypal.com";

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
SAFE PAYPAL RESPONSE
=========================================================
*/

async function readPayPalResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error(
      "PayPal returned non-JSON response:",
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

  const response =
    await fetch(
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
    await readPayPalResponse(
      response
    );

  if (!response.ok) {
    console.error(
      "PayPal authentication failed:",
      {
        status:
          response.status,
        data,
      }
    );

    throw new Error(
      "Could not authenticate with PayPal."
    );
  }

  if (!data?.access_token) {
    console.error(
      "PayPal access token missing:",
      data
    );

    throw new Error(
      "PayPal did not return an access token."
    );
  }

  return data.access_token as string;
}

/*
=========================================================
GET LOGGED IN SUPABASE USER
=========================================================
*/

async function getAuthenticatedUser(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (!authorization) {
    throw new Error(
      "Authorization header is missing."
    );
  }

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    throw new Error(
      "Invalid authorization header."
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
  GET PACKAGE
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
  CREATE ORDER
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
              description:
                `${novux.toLocaleString()} Novux`,

              custom_id:
                `novux_${novux}`,

              amount: {
                currency_code: "USD",

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
  READ RESPONSE
  =======================================================
  */

  const orderData =
    await readPayPalResponse(
      orderResponse
    );

  /*
  =======================================================
  PAYPAL ERROR
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
  ORDER ID
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
  LOG
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
    "================================="
  );

  return {
    orderID:
      orderData.id,

    novux:
      packageData.novux,

    price:
      packageData.price,

    currency:
      "USD",
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
  3. GET PAYPAL ACCESS TOKEN
  =======================================================
  */

  const accessToken =
    await getPayPalAccessToken();

  /*
  =======================================================
  4. CAPTURE PAYPAL ORDER
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

        body: JSON.stringify({}),

        cache: "no-store",
      }
    );

  /*
  =======================================================
  5. READ PAYPAL RESPONSE
  =======================================================
  */

  const captureData =
    await readPayPalResponse(
      captureResponse
    );

  /*
  =======================================================
  6. PAYPAL CAPTURE ERROR
  =======================================================
  */

  if (!captureResponse.ok) {
    console.error(
      "PayPal capture failed:",
      {
        status:
          captureResponse.status,

        statusText:
          captureResponse.statusText,

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
  7. CHECK CAPTURE STATUS
  =======================================================
  */

  if (
    captureData?.status !==
    "COMPLETED"
  ) {
    console.error(
      "PayPal capture not completed:",
      captureData
    );

    throw new Error(
      "PayPal payment was not completed."
    );
  }

  /*
  =======================================================
  8. FIND PURCHASE UNIT
  =======================================================
  */

  const purchaseUnit =
    Array.isArray(
      captureData?.purchase_units
    )
      ? captureData.purchase_units[0]
      : null;

  if (!purchaseUnit) {
    throw new Error(
      "PayPal purchase information is missing."
    );
  }

  /*
  =======================================================
  9. FIND CAPTURE
  =======================================================
  */

  const capture =
    Array.isArray(
      purchaseUnit?.payments
        ?.captures
    )
      ? purchaseUnit
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
  10. VERIFY CAPTURE STATUS
  =======================================================
  */

  if (
    capture.status !==
    "COMPLETED"
  ) {
    console.error(
      "Capture status is not COMPLETED:",
      capture
    );

    throw new Error(
      "PayPal capture was not completed."
    );
  }

  /*
  =======================================================
  11. GET NOVUX FROM CUSTOM ID
  =======================================================
  */

  const customID =
    purchaseUnit?.custom_id;

  if (
    typeof customID !==
    "string"
  ) {
    throw new Error(
      "Novux package information is missing from the PayPal order."
    );
  }

  if (
    !customID.startsWith(
      "novux_"
    )
  ) {
    throw new Error(
      "Invalid Novux package information."
    );
  }

  const novux =
    Number(
      customID.replace(
        "novux_",
        ""
      )
    );

  /*
  =======================================================
  12. VALIDATE NOVUX
  =======================================================
  */

  if (
    !Number.isFinite(novux) ||
    !PACKAGES[novux]
  ) {
    throw new Error(
      "Invalid Novux package."
    );
  }

  const packageData =
    PACKAGES[novux];

  /*
  =======================================================
  13. VERIFY PAYPAL PRICE
  =======================================================
  */

  const paypalAmount =
    Number(
      capture?.amount
        ?.value ??
        purchaseUnit
          ?.amount?.value ??
        0
    );

  const expectedAmount =
    packageData.price;

  if (
    !Number.isFinite(
      paypalAmount
    ) ||
    paypalAmount !==
      expectedAmount
  ) {
    console.error(
      "PayPal amount mismatch:",
      {
        paypalAmount,
        expectedAmount,
        novux,
        orderID,
      }
    );

    throw new Error(
      "Payment amount does not match the selected Novux package."
    );
  }

  /*
  =======================================================
  14. GET SUPABASE ADMIN
  =======================================================
  */

  const supabase =
    getSupabaseAdmin();

  /*
  =======================================================
  15. GET CURRENT PROFILE
  =======================================================
  */

  const {
    data: profile,
    error:
      profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id, username, novux_balance"
    )
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(
      "Could not find user profile:",
      profileError
    );

    throw new Error(
      "Could not find your Nova profile."
    );
  }

  /*
  =======================================================
  16. CURRENT BALANCE
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
  17. NEW BALANCE
  =======================================================
  */

  const newBalance =
    currentBalance + novux;

  /*
  =======================================================
  18. UPDATE NOVUX BALANCE
  =======================================================
  */

  const {
    data: updatedProfile,
    error:
      updateProfileError,
  } = await supabase
    .from("profiles")
    .update({
      novux_balance:
        newBalance,
    })
    .eq("id", user.id)
    .select(
      "id, username, novux_balance"
    )
    .single();

  if (updateProfileError) {
    console.error(
      "Could not update Novux balance:",
      updateProfileError
    );

    throw new Error(
      "Payment succeeded, but Novux could not be added to your account. Please contact support."
    );
  }

  /*
  =======================================================
  19. SUCCESS LOG
  =======================================================
  */

  console.log(
    "================================="
  );

  console.log(
    "PAYPAL PAYMENT COMPLETED"
  );

  console.log(
    "User:",
    user.id
  );

  console.log(
    "Username:",
    profile.username
  );

  console.log(
    "Order ID:",
    orderID
  );

  console.log(
    "Capture ID:",
    capture.id
  );

  console.log(
    "Novux Added:",
    novux
  );

  console.log(
    "Old Balance:",
    currentBalance
  );

  console.log(
    "New Balance:",
    newBalance
  );

  console.log(
    "Price:",
    packageData.price
  );

  console.log(
    "================================="
  );

  /*
  =======================================================
  20. RETURN SUCCESS
  =======================================================
  */

  return {
    success: true,

    orderID,

    captureID:
      capture.id,

    novux,

    price:
      packageData.price,

    currency:
      "USD",

    previousBalance:
      currentBalance,

    newBalance,

    userID:
      user.id,

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
    1. READ JSON
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
    2. CHECK BODY
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
    3. READ ACTION
    =====================================================
    */

    const action =
      typeof requestBody.action ===
      "string"
        ? requestBody.action
        : "";

    /*
    =====================================================
    4. DETERMINE REQUEST TYPE
    =====================================================
    */

    /*
    IMPORTANT:
    The current frontend sends:

    CREATE:
    {
      novux: 300
    }

    CAPTURE:
    {
      orderID: "..."
    }

    Therefore we support both the explicit
    action format AND the current frontend format.
    */

    const hasNovux =
      requestBody.novux !==
        undefined &&
      requestBody.novux !==
        null;

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

      /*
      ===============================================
      VALIDATE NOVUX
      ===============================================
      */

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

      /*
      ===============================================
      CHECK PACKAGE
      ===============================================
      */

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

      /*
      ===============================================
      CREATE PAYPAL ORDER
      ===============================================
      */

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

      /*
      ===============================================
      VALIDATE ORDER ID
      ===============================================
      */

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

      /*
      ===============================================
      CAPTURE
      ===============================================
      */

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
    INVALID ACTION
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