import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

/*
=========================================================
NOVUX PACKAGES
=========================================================
*/

const PACKAGES: Record<
  string,
  {
    novux: number;
    price: string;
  }
> = {
  "300": {
    novux: 300,
    price: "3.00",
  },

  "1000": {
    novux: 1000,
    price: "7.00",
  },

  "1500": {
    novux: 1500,
    price: "9.00",
  },

  "2500": {
    novux: 2500,
    price: "15.00",
  },

  "5000": {
    novux: 5000,
    price: "25.00",
  },

  "10000": {
    novux: 10000,
    price: "45.00",
  },
};

/*
=========================================================
GET PAYPAL ACCESS TOKEN
=========================================================
*/

async function getPayPalAccessToken() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID?.trim();

  const clientSecret =
    process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error(
      "PayPal credentials are missing."
    );

    throw new Error(
      "PayPal environment variables are missing."
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
        Authorization: `Basic ${auth}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },

      body: "grant_type=client_credentials",

      cache: "no-store",
    }
  );

  const text =
    await response.text();

  let data: any = null;

  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      "PayPal token response was not JSON:",
      text.slice(0, 1000)
    );

    throw new Error(
      "PayPal returned an invalid authentication response."
    );
  }

  if (!response.ok) {
    console.error(
      "PayPal token error:",
      data
    );

    throw new Error(
      data?.error_description ||
        "Could not get PayPal access token."
    );
  }

  if (!data?.access_token) {
    throw new Error(
      "PayPal access token was not returned."
    );
  }

  return data.access_token as string;
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
    1. CHECK LOGIN
    =====================================================
    */

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAccessToken =
      authorization
        .replace("Bearer ", "")
        .trim();

    /*
    =====================================================
    2. SUPABASE
    =====================================================
    */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      console.error(
        "Supabase environment variables are missing."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase environment variables are missing.",
        },
        {
          status: 500,
        }
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        supabaseKey
      );

    /*
    =====================================================
    3. GET CURRENT USER
    =====================================================
    */

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await supabase.auth.getUser(
        supabaseAccessToken
      );

    if (
      userError ||
      !user
    ) {
      console.error(
        "Supabase user error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Your login session is invalid.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    =====================================================
    4. READ REQUEST
    =====================================================
    */

    const body =
      await request.json();

    const orderID =
      body?.orderID;

    if (
      !orderID ||
      typeof orderID !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "================================="
    );

    console.log(
      "PAYPAL CAPTURE START"
    );

    console.log(
      "User:",
      user.id
    );

    console.log(
      "Order ID:",
      orderID
    );

    console.log(
      "================================="
    );

    /*
    =====================================================
    5. GET PAYPAL ACCESS TOKEN
    =====================================================
    */

    const paypalAccessToken =
      await getPayPalAccessToken();

    /*
    =====================================================
    6. GET PAYPAL ORDER
    =====================================================
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
              `Bearer ${paypalAccessToken}`,

            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },

          cache: "no-store",
        }
      );

    const orderText =
      await orderResponse.text();

    let orderData: any = null;

    try {
      orderData =
        JSON.parse(orderText);
    } catch {
      console.error(
        "PayPal order response was not JSON:",
        orderText.slice(0, 1000)
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal returned an invalid order response.",
        },
        {
          status: 502,
        }
      );
    }

    if (
      !orderResponse.ok
    ) {
      console.error(
        "PayPal order lookup error:",
        orderData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not find the PayPal order.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    7. READ PURCHASE UNIT
    =====================================================
    */

    const purchaseUnit =
      orderData?.purchase_units?.[0];

    if (!purchaseUnit) {
      console.error(
        "PayPal order has no purchase unit:",
        orderData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal order information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    8. READ PACKAGE IDENTIFIERS
    =====================================================

    We support BOTH:

    custom_id:
      novux_300

    AND:

    reference_id:
      nova-novux-300

    This makes the route compatible with
    the order created by our create-order route.
    */

    const customId =
      purchaseUnit?.custom_id;

    const referenceId =
      purchaseUnit?.reference_id;

    console.log(
      "PayPal custom_id:",
      customId
    );

    console.log(
      "PayPal reference_id:",
      referenceId
    );

    /*
    =====================================================
    9. FIND NOVUX AMOUNT
    =====================================================
    */

    let novuxAmount: number | null =
      null;

    /*
    -----------------------------------------
    OPTION A: custom_id
    -----------------------------------------
    */

    if (
      typeof customId === "string" &&
      customId.startsWith(
        "novux_"
      )
    ) {
      const value =
        Number(
          customId.replace(
            "novux_",
            ""
          )
        );

      if (
        Number.isFinite(value)
      ) {
        novuxAmount = value;
      }
    }

    /*
    -----------------------------------------
    OPTION B: reference_id
    -----------------------------------------
    */

    if (
      novuxAmount === null &&
      typeof referenceId ===
        "string" &&
      referenceId.startsWith(
        "nova-novux-"
      )
    ) {
      const value =
        Number(
          referenceId.replace(
            "nova-novux-",
            ""
          )
        );

      if (
        Number.isFinite(value)
      ) {
        novuxAmount = value;
      }
    }

    /*
    =====================================================
    10. PACKAGE NOT FOUND
    =====================================================
    */

    if (
      novuxAmount === null
    ) {
      console.error(
        "Could not determine Novux package."
      );

      console.error(
        "custom_id:",
        customId
      );

      console.error(
        "reference_id:",
        referenceId
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Novux package.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    11. VERIFY PACKAGE
    =====================================================
    */

    const packageData =
      PACKAGES[
        String(novuxAmount)
      ];

    if (!packageData) {
      console.error(
        "Unknown Novux package:",
        novuxAmount
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Novux package.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "Novux package:",
      packageData.novux
    );

    console.log(
      "Expected price:",
      packageData.price
    );

    /*
    =====================================================
    12. VERIFY ORDER AMOUNT
    =====================================================
    */

    const orderAmount =
      purchaseUnit?.amount?.value;

    const orderCurrency =
      purchaseUnit?.amount
        ?.currency_code;

    console.log(
      "PayPal order amount:",
      orderAmount
    );

    console.log(
      "PayPal order currency:",
      orderCurrency
    );

    if (
      orderAmount !==
      packageData.price
    ) {
      console.error(
        "Invalid PayPal order amount:",
        {
          expected:
            packageData.price,

          received:
            orderAmount,

          novux:
            packageData.novux,

          orderID,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    13. VERIFY CURRENCY
    =====================================================
    */

    if (
      orderCurrency !==
      "USD"
    ) {
      console.error(
        "Invalid PayPal currency:",
        orderCurrency
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payment currency.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    14. CHECK ORDER STATUS
    =====================================================
    */

    console.log(
      "PayPal order status:",
      orderData?.status
    );

    if (
      orderData?.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This PayPal order has already been completed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    15. CAPTURE PAYPAL ORDER
    =====================================================
    */

    console.log(
      "Capturing PayPal order..."
    );

    const captureResponse =
      await fetch(
        `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(
          orderID
        )}/capture`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${paypalAccessToken}`,

            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            "PayPal-Request-Id":
              `capture-${orderID}`,
          },

          body:
            JSON.stringify({}),

          cache: "no-store",
        }
      );

    const captureText =
      await captureResponse.text();

    let captureData: any = null;

    try {
      captureData =
        JSON.parse(captureText);
    } catch {
      console.error(
        "PayPal capture response was not JSON:",
        captureText.slice(
          0,
          1000
        )
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal returned an invalid capture response.",
        },
        {
          status: 502,
        }
      );
    }

    /*
    =====================================================
    16. PAYPAL CAPTURE ERROR
    =====================================================
    */

    if (
      !captureResponse.ok
    ) {
      console.error(
        "PayPal capture error:",
        captureData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            captureData?.details?.[0]
              ?.description ||
            captureData?.message ||
            "PayPal could not capture this payment.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    17. PAYMENT MUST BE COMPLETED
    =====================================================
    */

    if (
      captureData?.status !==
      "COMPLETED"
    ) {
      console.error(
        "Payment not completed:",
        captureData?.status
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "Payment was not completed.",

          status:
            captureData?.status,
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    18. GET CAPTURE INFORMATION
    =====================================================
    */

    const capturedPurchaseUnit =
      captureData?.purchase_units?.[0];

    const capture =
      capturedPurchaseUnit
        ?.payments
        ?.captures?.[0];

    const paidAmount =
      capture?.amount?.value;

    const paidCurrency =
      capture?.amount
        ?.currency_code;

    const captureID =
      capture?.id;

    if (!captureID) {
      console.error(
        "PayPal capture ID missing:",
        captureData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal capture ID is missing.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    19. VERIFY CAPTURE AMOUNT
    =====================================================
    */

    if (
      paidAmount !==
      packageData.price
    ) {
      console.error(
        "Invalid captured amount:",
        {
          expected:
            packageData.price,

          received:
            paidAmount,

          orderID,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    20. VERIFY CAPTURE CURRENCY
    =====================================================
    */

    if (
      paidCurrency !==
      "USD"
    ) {
      console.error(
        "Invalid captured currency:",
        paidCurrency
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payment currency.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    21. GET PROFILE
    =====================================================
    */

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select(
          "novux_balance"
        )
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      profileError ||
      !profile
    ) {
      console.error(
        "Profile error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not load your Nova profile.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    22. CURRENT BALANCE
    =====================================================
    */

    const currentBalance =
      Number(
        profile.novux_balance ?? 0
      );

    /*
    =====================================================
    23. ADD NOVUX
    =====================================================
    */

    const newBalance =
      currentBalance +
      packageData.novux;

    const {
      error: updateError,
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
        );

    if (updateError) {
      console.error(
        "Novux balance update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment succeeded, but Novux could not be added.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    24. SUCCESS
    =====================================================
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
      "PayPal Order:",
      orderID
    );

    console.log(
      "PayPal Capture:",
      captureID
    );

    console.log(
      "PayPal Custom ID:",
      customId
    );

    console.log(
      "PayPal Reference ID:",
      referenceId
    );

    console.log(
      "Paid:",
      paidCurrency,
      paidAmount
    );

    console.log(
      "Added Novux:",
      packageData.novux
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
    =====================================================
    25. RETURN SUCCESS
    =====================================================
    */

    return NextResponse.json({
      success: true,

      orderID,

      captureID,

      status:
        captureData.status,

      paidAmount,

      paidCurrency,

      addedNovux:
        packageData.novux,

      newBalance,
    });
  } catch (error) {
    console.error(
      "Capture PayPal order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while capturing the PayPal payment.",
      },
      {
        status: 500,
      }
    );
  }
}