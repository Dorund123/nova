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
    process.env.PAYPAL_CLIENT_ID;

  const clientSecret =
    process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
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
      },
      body:
        "grant_type=client_credentials",
      cache: "no-store",
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "PayPal token error:",
      data
    );

    throw new Error(
      "Could not get PayPal access token."
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
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY ||
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
      body.orderID;

    const packageAmount =
      Number(body.novux);

    const packagePrice =
      Number(body.price);

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

    if (
      !Number.isFinite(
        packageAmount
      ) ||
      !Number.isFinite(
        packagePrice
      )
    ) {
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
    5. CHECK PACKAGE
    =====================================================
    */

    const packageData =
      PACKAGES[
        String(packageAmount)
      ];

    if (!packageData) {
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

    if (
      Number(packageData.price) !==
      packagePrice
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Novux package price.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    6. GET PAYPAL TOKEN
    =====================================================
    */

    const paypalAccessToken =
      await getPayPalAccessToken();

    /*
    =====================================================
    7. CAPTURE PAYPAL ORDER
    =====================================================
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
              `Bearer ${paypalAccessToken}`,

            "Content-Type":
              "application/json",

            "PayPal-Request-Id":
              `capture-${orderID}`,
          },

          body: JSON.stringify({}),

          cache: "no-store",
        }
      );

    const captureData =
      await captureResponse.json();

    /*
    =====================================================
    8. PAYPAL CAPTURE ERROR
    =====================================================
    */

    if (
      !captureResponse.ok
    ) {
      console.error(
        "PayPal capture error:",
        captureData
      );

      /*
      If PayPal says the order was
      already captured, we stop here.

      This prevents accidentally
      adding Novux twice.
      */

      return NextResponse.json(
        {
          success: false,
          error:
            "PayPal could not capture this payment. The order may already have been completed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    9. PAYMENT MUST BE COMPLETED
    =====================================================
    */

    if (
      captureData.status !==
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment was not completed.",
          status:
            captureData.status,
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    10. GET CAPTURE
    =====================================================
    */

    const purchaseUnit =
      captureData
        .purchase_units?.[0];

    const capture =
      purchaseUnit
        ?.payments
        ?.captures?.[0];

    const paidAmount =
      capture
        ?.amount?.value;

    const paidCurrency =
      capture
        ?.amount
        ?.currency_code;

    const captureID =
      capture?.id;

    if (!captureID) {
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
    11. VERIFY PAYMENT AMOUNT
    =====================================================
    */

    if (
      paidAmount !==
      packageData.price
    ) {
      console.error(
        "Invalid PayPal amount:",
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
    12. VERIFY CURRENCY
    =====================================================
    */

    if (
      paidCurrency !==
      "USD"
    ) {
      console.error(
        "Invalid PayPal currency:",
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
    13. GET PROFILE
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
      profileError
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
    14. CURRENT BALANCE
    =====================================================
    */

    const currentBalance =
      Number(
        profile?.novux_balance ??
          0
      );

    /*
    =====================================================
    15. ADD NOVUX
    =====================================================
    */

    const newBalance =
      currentBalance +
      packageData.novux;

    const {
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
        );

    if (
      updateError
    ) {
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
    16. SUCCESS
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
          "Something went wrong while capturing the PayPal payment.",
      },
      {
        status: 500,
      }
    );
  }
}