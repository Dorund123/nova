import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
PAYPAL ERROR MESSAGE
=========================================================
*/

function getPayPalPaymentError(
  data: any
) {
  const issue =
    data?.details?.[0]?.issue ||
    data?.issue ||
    data?.name ||
    "";

  const description =
    data?.details?.[0]?.description ||
    data?.message ||
    "";

  const capture =
    data?.purchase_units?.[0]
      ?.payments?.captures?.[0];

  const captureStatus =
    capture?.status;

  const statusReason =
    capture?.status_details?.reason;

  const processorCode =
    capture?.processor_response
      ?.response_code;

  const paymentAdviceCode =
    capture?.payment_advice_code;

  const allText = [
    issue,
    description,
    statusReason,
    processorCode,
    paymentAdviceCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  /*
  =======================================================
  INSUFFICIENT FUNDS
  =======================================================
  */

  if (
    allText.includes(
      "insufficient_funds"
    ) ||
    allText.includes(
      "insufficient funds"
    ) ||
    allText.includes(
      "ccreject-if"
    )
  ) {
    return {
      code: "INSUFFICIENT_FUNDS",
      message:
        "Payment declined because the card does not have enough funds.",
    };
  }

  /*
  =======================================================
  INSTRUMENT DECLINED
  =======================================================
  */

  if (
    issue ===
      "INSTRUMENT_DECLINED" ||
    allText.includes(
      "instrument_declined"
    )
  ) {
    return {
      code: "INSTRUMENT_DECLINED",
      message:
        "Payment was declined. Please check your card or use another card.",
    };
  }

  /*
  =======================================================
  GENERIC DECLINE
  =======================================================
  */

  if (
    allText.includes(
      "generic_decline"
    ) ||
    allText.includes(
      "card was declined"
    ) ||
    allText.includes(
      "transaction refused"
    ) ||
    allText.includes(
      "transaction_refused"
    )
  ) {
    return {
      code: "CARD_DECLINED",
      message:
        "Payment was declined by your card issuer. Please use another card.",
    };
  }

  /*
  =======================================================
  EXPIRED CARD
  =======================================================
  */

  if (
    allText.includes(
      "card_expired"
    ) ||
    allText.includes(
      "expired"
    )
  ) {
    return {
      code: "CARD_EXPIRED",
      message:
        "Payment failed because the card is expired.",
    };
  }

  /*
  =======================================================
  INVALID CARD
  =======================================================
  */

  if (
    allText.includes(
      "invalid_or_restricted_card"
    ) ||
    allText.includes(
      "invalid card"
    ) ||
    allText.includes(
      "invalid account"
    )
  ) {
    return {
      code: "INVALID_CARD",
      message:
        "Payment failed because the card is invalid or restricted.",
    };
  }

  /*
  =======================================================
  CVV
  =======================================================
  */

  if (
    allText.includes(
      "cvv"
    ) ||
    allText.includes(
      "cvc"
    ) ||
    allText.includes(
      "security code"
    ) ||
    allText.includes(
      "cvv2"
    )
  ) {
    return {
      code: "INVALID_CVV",
      message:
        "Payment failed because the card security code is incorrect.",
    };
  }

  /*
  =======================================================
  BILLING ADDRESS
  =======================================================
  */

  if (
    allText.includes(
      "billing"
    ) &&
    allText.includes(
      "address"
    )
  ) {
    return {
      code: "BILLING_ADDRESS",
      message:
        "Payment failed because the billing address could not be verified.",
    };
  }

  /*
  =======================================================
  PAYER CANNOT PAY
  =======================================================
  */

  if (
    allText.includes(
      "payer_cannot_pay"
    )
  ) {
    return {
      code: "PAYER_CANNOT_PAY",
      message:
        "This payment method cannot complete the purchase.",
    };
  }

  /*
  =======================================================
  PAYER ACCOUNT
  =======================================================
  */

  if (
    allText.includes(
      "payer_account_locked"
    ) ||
    allText.includes(
      "payer_account_restricted"
    )
  ) {
    return {
      code: "PAYER_ACCOUNT",
      message:
        "This PayPal account cannot complete the payment.",
    };
  }

  /*
  =======================================================
  FALLBACK
  =======================================================
  */

  return {
    code:
      issue ||
      "PAYMENT_FAILED",

    message:
      "Payment could not be completed. No Novux was added.",
  };
}

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

  if (
    !clientId ||
    !clientSecret
  ) {
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
        data?.error ||
        "Could not get PayPal access token."
    );
  }

  if (
    !data?.access_token
  ) {
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
        .replace(
          "Bearer ",
          ""
        )
        .trim();

    if (
      !supabaseAccessToken
    ) {
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
    2. SUPABASE ENVIRONMENT
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

    /*
    =====================================================
    3. CREATE USER-AUTHENTICATED SUPABASE CLIENT
    =====================================================
    */

    const supabase =
      createClient(
        supabaseUrl,
        supabaseKey,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${supabaseAccessToken}`,
            },
          },
        }
      );

    /*
    =====================================================
    4. GET CURRENT USER
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
    5. READ REQUEST
    =====================================================
    */

    let body: any = null;

    try {
      body =
        await request.json();
    } catch {
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

    const orderID =
      body?.orderID;

    if (
      !orderID ||
      typeof orderID !==
        "string"
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
    6. GET PAYPAL ACCESS TOKEN
    =====================================================
    */

    const paypalAccessToken =
      await getPayPalAccessToken();

    /*
    =====================================================
    7. GET PAYPAL ORDER
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
        orderText.slice(
          0,
          1000
        )
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
    8. ORDER STATUS
    =====================================================
    */

    console.log(
      "PayPal order status:",
      orderData?.status
    );

    /*
    =====================================================
    IMPORTANT:
    If already COMPLETED, don't add Novux again.
    =====================================================
    */

    if (
      orderData?.status ===
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          status:
            "COMPLETED",

          error:
            "This PayPal order has already been completed. Novux were not added again.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =====================================================
    9. GET PURCHASE UNIT
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
    10. PACKAGE IDENTIFIERS
    =====================================================
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
    11. FIND NOVUX AMOUNT
    =====================================================
    */

    let novuxAmount:
      | number
      | null = null;

    /*
    -----------------------------------------------------
    CUSTOM ID
    -----------------------------------------------------
    */

    if (
      typeof customId ===
        "string" &&
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
        Number.isFinite(
          value
        )
      ) {
        novuxAmount =
          value;
      }
    }

    /*
    -----------------------------------------------------
    REFERENCE ID
    -----------------------------------------------------
    */

    if (
      novuxAmount ===
        null &&
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
        Number.isFinite(
          value
        )
      ) {
        novuxAmount =
          value;
      }
    }

    /*
    =====================================================
    12. PACKAGE NOT FOUND
    =====================================================
    */

    if (
      novuxAmount ===
      null
    ) {
      console.error(
        "Could not determine Novux package."
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
    13. VERIFY PACKAGE
    =====================================================
    */

    const packageData =
      PACKAGES[
        String(
          novuxAmount
        )
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
    14. VERIFY ORDER AMOUNT
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
    15. VERIFY CURRENCY
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
    16. CAPTURE PAYPAL ORDER
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

            /*
            -------------------------------------------------
            PayPal idempotency key
            -------------------------------------------------
            */

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
          1500
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

    console.log(
      "PayPal capture response:",
      captureData
    );

    /*
    =====================================================
    17. HANDLE PAYPAL HTTP ERRORS
    =====================================================
    */

    if (
      !captureResponse.ok
    ) {
      console.error(
        "PayPal capture HTTP error:",
        captureData
      );

      const paymentError =
        getPayPalPaymentError(
          captureData
        );

      return NextResponse.json(
        {
          success: false,

          captureStatus:
            captureData?.status ||
            null,

          status:
            captureData?.status ||
            null,

          paypalIssue:
            paymentError.code,

          error:
            paymentError.message,

          paypalMessage:
            captureData?.message ||
            null,

          details:
            captureData?.details ||
            null,
        },
        {
          status:
            captureResponse.status >=
            400 &&
            captureResponse.status <
            500
              ? 400
              : 502,
        }
      );
    }

    /*
    =====================================================
    18. TOP-LEVEL CAPTURE STATUS
    =====================================================
    */

    const topLevelStatus =
      captureData?.status;

    console.log(
      "PayPal top-level status:",
      topLevelStatus
    );

    /*
    =====================================================
    19. FIND CAPTURE
    =====================================================
    */

    const capturedPurchaseUnit =
      captureData
        ?.purchase_units?.[0];

    const captures =
      capturedPurchaseUnit
        ?.payments
        ?.captures || [];

    const capture =
      captures?.[0];

    const captureStatus =
      capture?.status ||
      topLevelStatus ||
      null;

    console.log(
      "Actual payment capture status:",
      captureStatus
    );

    /*
    =====================================================
    20. IF CAPTURE IS NOT COMPLETED
    =====================================================
    */

    if (
      captureStatus !==
      "COMPLETED"
    ) {
      console.error(
        "Payment was not completed:",
        {
          orderID,

          topLevelStatus,

          captureStatus,

          capture,
        }
      );

      const paymentError =
        getPayPalPaymentError(
          captureData
        );

      return NextResponse.json(
        {
          success: false,

          captureStatus,

          status:
            topLevelStatus,

          paypalIssue:
            paymentError.code,

          error:
            paymentError.message,

          details:
            captureData?.details ||
            null,
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    21. CAPTURE ID
    =====================================================
    */

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

          captureStatus:
            "COMPLETED",

          error:
            "PayPal completed the payment, but the capture ID was missing. No Novux were added.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    22. VERIFY CAPTURE AMOUNT
    =====================================================
    */

    const paidAmount =
      capture?.amount?.value;

    const paidCurrency =
      capture?.amount
        ?.currency_code;

    console.log(
      "Captured amount:",
      paidAmount
    );

    console.log(
      "Captured currency:",
      paidCurrency
    );

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

          captureID,
        }
      );

      return NextResponse.json(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          error:
            "The captured payment amount does not match the Novux package. No Novux were added.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    23. VERIFY CAPTURE CURRENCY
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

          captureStatus:
            "COMPLETED",

          error:
            "The captured payment currency is invalid. No Novux were added.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    24. GET USER PROFILE
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

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but your Nova profile could not be loaded. No Novux were added.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    25. READ CURRENT BALANCE
    =====================================================
    */

    const currentBalance =
      Number(
        profile.novux_balance ??
          0
      );

    if (
      !Number.isFinite(
        currentBalance
      ) ||
      currentBalance < 0
    ) {
      console.error(
        "Invalid current Novux balance:",
        currentBalance
      );

      return NextResponse.json(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Your Nova balance is invalid. No Novux were added.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    26. CALCULATE NEW BALANCE
    =====================================================
    */

    const newBalance =
      currentBalance +
      packageData.novux;

    console.log(
      "Current balance:",
      currentBalance
    );

    console.log(
      "Novux to add:",
      packageData.novux
    );

    console.log(
      "New balance:",
      newBalance
    );

    /*
    =====================================================
    27. UPDATE BALANCE
    =====================================================

    IMPORTANT:
    We also match the OLD balance.

    This protects against two simultaneous requests
    trying to add the same purchase at the same time.
    =====================================================
    */

    const {
      data: updatedProfile,
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
        )
        .eq(
          "novux_balance",
          currentBalance
        )
        .select(
          "novux_balance"
        )
        .maybeSingle();

    if (updateError) {
      console.error(
        "Novux balance update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but Nova could not update your balance. No Novux were added.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    28. UPDATE MUST AFFECT PROFILE
    =====================================================
    */

    if (
      !updatedProfile
    ) {
      console.error(
        "Balance update affected zero rows.",
        {
          userID: user.id,

          currentBalance,

          newBalance,

          captureID,
        }
      );

      return NextResponse.json(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but Nova could not safely update your balance. No additional Novux were added.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =====================================================
    29. VERIFY UPDATED BALANCE
    =====================================================
    */

    const finalBalance =
      Number(
        updatedProfile
          .novux_balance
      );

    if (
      finalBalance !==
      newBalance
    ) {
      console.error(
        "Unexpected final balance:",
        {
          expected:
            newBalance,

          received:
            finalBalance,

          captureID,
        }
      );

      return NextResponse.json(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but the final balance could not be verified.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    =====================================================
    30. SUCCESS
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
      "Capture status:",
      captureStatus
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
      finalBalance
    );

    console.log(
      "================================="
    );

    /*
    =====================================================
    31. RETURN SUCCESS
    =====================================================
    */

    return NextResponse.json(
      {
        success: true,

        orderID,

        captureID,

        status:
          topLevelStatus,

        captureStatus:
          captureStatus,

        paidAmount,

        paidCurrency,

        addedNovux:
          packageData.novux,

        previousBalance:
          currentBalance,

        newBalance:
          finalBalance,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
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