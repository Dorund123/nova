import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
=========================================================
PAYPAL PRODUCTION API
=========================================================
*/

const PAYPAL_API =
  "https://api-m.paypal.com";

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
NO-CACHE JSON RESPONSE
=========================================================
*/

function jsonResponse(
  data: any,
  status = 200
) {
  return NextResponse.json(
    data,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

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
      "insufficient"
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
    ) ||
    allText.includes(
      "instrument declined"
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
    ) ||
    allText.includes(
      "declined by"
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
      "expired card"
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
    ) ||
    allText.includes(
      "card is invalid"
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
  CVV / CVC
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
    ) ||
    allText.includes(
      "payer cannot pay"
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
      description ||
      "Payment could not be completed. No Novux were added.",
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
      "PayPal Production credentials are missing."
    );

    throw new Error(
      "PayPal Production credentials are missing."
    );
  }

  const auth =
    Buffer.from(
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

  let data: any;

  try {
    data =
      text
        ? JSON.parse(text)
        : {};
  } catch {
    console.error(
      "PayPal token response was not JSON:",
      text.slice(
        0,
        1000
      )
    );

    throw new Error(
      "PayPal returned an invalid authentication response."
    );
  }

  if (
    !response.ok
  ) {
    console.error(
      "PayPal token error:",
      data
    );

    throw new Error(
      data?.error_description ||
        data?.error ||
        data?.message ||
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
SAFE JSON PARSER
=========================================================
*/

async function readPayPalJson(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  const trimmed =
    text.trimStart();

  if (
    trimmed.startsWith(
      "<!DOCTYPE"
    ) ||
    trimmed.startsWith(
      "<html"
    )
  ) {
    console.error(
      "PayPal returned HTML:",
      text.slice(
        0,
        1000
      )
    );

    throw new Error(
      "PayPal returned an invalid HTML response."
    );
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    console.error(
      "PayPal returned invalid JSON:",
      text.slice(
        0,
        1000
      )
    );

    throw new Error(
      "PayPal returned an invalid JSON response."
    );
  }
}

/*
=========================================================
POST /api/paypal/create-order/capture-order
=========================================================
*/

export async function POST(
  request: Request
) {
  try {
    /*
    =====================================================
    1. AUTHORIZATION HEADER
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
      return jsonResponse(
        {
          success: false,

          error:
            "You must be logged in.",
        },
        401
      );
    }

    const supabaseAccessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim();

    if (
      !supabaseAccessToken
    ) {
      return jsonResponse(
        {
          success: false,

          error:
            "Your login session is invalid.",
        },
        401
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

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseServiceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      (
        !supabaseAnonKey &&
        !supabaseServiceRoleKey
      )
    ) {
      console.error(
        "Supabase environment variables are missing."
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Supabase environment variables are missing.",
        },
        500
      );
    }

    /*
    =====================================================
    3. AUTH CLIENT
    =====================================================
    */

    const authClient =
      createClient(
        supabaseUrl,
        supabaseAnonKey ||
          supabaseServiceRoleKey!,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,

            detectSessionInUrl:
              false,
          },
        }
      );

    /*
    =====================================================
    4. VERIFY USER TOKEN
    =====================================================
    */

    const {
      data: {
        user,
      },
      error: userError,
    } =
      await authClient.auth.getUser(
        supabaseAccessToken
      );

    if (
      userError ||
      !user
    ) {
      console.error(
        "Supabase authentication error:",
        userError
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Your login session is invalid.",
        },
        401
      );
    }

    /*
    =====================================================
    5. DATABASE CLIENT
    =====================================================
    
    If SUPABASE_SERVICE_ROLE_KEY exists, use it for the
    server-side Novux balance update.

    IMPORTANT:
    Never put SUPABASE_SERVICE_ROLE_KEY in page.tsx.
    =====================================================
    */

    const dbClient =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey ||
          supabaseAnonKey!,
        supabaseServiceRoleKey
          ? {
              auth: {
                autoRefreshToken:
                  false,

                persistSession:
                  false,

                detectSessionInUrl:
                  false,
              },
            }
          : {
              global: {
                headers: {
                  Authorization:
                    `Bearer ${supabaseAccessToken}`,
                },
              },

              auth: {
                autoRefreshToken:
                  false,

                persistSession:
                  false,

                detectSessionInUrl:
                  false,
              },
            }
      );

    /*
    =====================================================
    6. READ REQUEST BODY
    =====================================================
    */

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,

          error:
            "Invalid request body.",
        },
        400
      );
    }

    const orderID =
      body?.orderID;

    if (
      !orderID ||
      typeof orderID !==
        "string"
    ) {
      return jsonResponse(
        {
          success: false,

          error:
            "PayPal order ID is required.",
        },
        400
      );
    }

    const cleanOrderID =
      orderID.trim();

    if (
      !cleanOrderID ||
      cleanOrderID.length >
        100
    ) {
      return jsonResponse(
        {
          success: false,

          error:
            "Invalid PayPal order ID.",
        },
        400
      );
    }

    console.log(
      "================================="
    );

    console.log(
      "PAYPAL PRODUCTION CAPTURE START"
    );

    console.log(
      "User:",
      user.id
    );

    console.log(
      "Order ID:",
      cleanOrderID
    );

    console.log(
      "================================="
    );

    /*
    =====================================================
    7. PAYPAL ACCESS TOKEN
    =====================================================
    */

    const paypalAccessToken =
      await getPayPalAccessToken();

    /*
    =====================================================
    8. GET PAYPAL ORDER
    =====================================================
    */

    const orderResponse =
      await fetch(
        `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(
          cleanOrderID
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${paypalAccessToken}`,

            Accept:
              "application/json",
          },

          cache: "no-store",
        }
      );

    let orderData: any;

    try {
      orderData =
        await readPayPalJson(
          orderResponse
        );
    } catch (
      error
    ) {
      console.error(
        "PayPal order response parse error:",
        error
      );

      return jsonResponse(
        {
          success: false,

          error:
            "PayPal returned an invalid order response.",
        },
        502
      );
    }

    console.log(
      "PayPal order HTTP status:",
      orderResponse.status
    );

    console.log(
      "PayPal order status:",
      orderData?.status
    );

    /*
    =====================================================
    9. ORDER LOOKUP FAILED
    =====================================================
    */

    if (
      !orderResponse.ok
    ) {
      console.error(
        "PayPal order lookup failed:",
        orderData
      );

      const paymentError =
        getPayPalPaymentError(
          orderData
        );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            orderData?.status ||
            null,

          paypalIssue:
            paymentError.code,

          error:
            paymentError.message,
        },
        orderResponse.status >=
          400 &&
        orderResponse.status <
          500
          ? 400
          : 502
      );
    }

    /*
    =====================================================
    10. GET PURCHASE UNIT
    =====================================================
    */

    const purchaseUnit =
      orderData?.purchase_units?.[0];

    if (
      !purchaseUnit
    ) {
      console.error(
        "PayPal order has no purchase unit:",
        orderData
      );

      return jsonResponse(
        {
          success: false,

          error:
            "PayPal order information is missing.",
        },
        400
      );
    }

    /*
    =====================================================
    11. GET PACKAGE IDENTIFIERS
    =====================================================
    */

    const customId =
      purchaseUnit?.custom_id ||
      "";

    const referenceId =
      purchaseUnit?.reference_id ||
      "";

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
    12. FIND NOVUX AMOUNT
    =====================================================
    */

    let novuxAmount:
      | number
      | null = null;

    if (
      typeof customId ===
        "string" &&
      customId.startsWith(
        "novux_"
      )
    ) {
      const parsed =
        Number(
          customId.replace(
            "novux_",
            ""
          )
        );

      if (
        Number.isInteger(
          parsed
        ) &&
        parsed > 0
      ) {
        novuxAmount =
          parsed;
      }
    }

    if (
      novuxAmount ===
        null &&
      typeof referenceId ===
        "string" &&
      referenceId.startsWith(
        "nova-novux-"
      )
    ) {
      const parsed =
        Number(
          referenceId.replace(
            "nova-novux-",
            ""
          )
        );

      if (
        Number.isInteger(
          parsed
        ) &&
        parsed > 0
      ) {
        novuxAmount =
          parsed;
      }
    }

    /*
    =====================================================
    13. VALIDATE PACKAGE
    =====================================================
    */

    if (
      novuxAmount ===
      null
    ) {
      console.error(
        "Could not determine Novux package."
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Invalid Novux package.",
        },
        400
      );
    }

    const packageData =
      PACKAGES[
        String(
          novuxAmount
        )
      ];

    if (
      !packageData
    ) {
      console.error(
        "Unknown Novux package:",
        novuxAmount
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Invalid Novux package.",
        },
        400
      );
    }

    console.log(
      "Novux:",
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
      "Order amount:",
      orderAmount
    );

    console.log(
      "Order currency:",
      orderCurrency
    );

    if (
      orderAmount !==
      packageData.price
    ) {
      console.error(
        "Order amount mismatch:",
        {
          expected:
            packageData.price,

          received:
            orderAmount,

          orderID:
            cleanOrderID,
        }
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Invalid payment amount.",
        },
        400
      );
    }

    /*
    =====================================================
    15. VERIFY USD
    =====================================================
    */

    if (
      orderCurrency !==
      "USD"
    ) {
      console.error(
        "Invalid order currency:",
        orderCurrency
      );

      return jsonResponse(
        {
          success: false,

          error:
            "Invalid payment currency.",
        },
        400
      );
    }

    /*
    =====================================================
    16. PREVENT CAPTURE OF ALREADY COMPLETED ORDER
    =====================================================
    */

    if (
      orderData?.status ===
      "COMPLETED"
    ) {
      console.warn(
        "PayPal order is already COMPLETED."
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          status:
            "COMPLETED",

          error:
            "This PayPal order has already been completed. Novux were not added again.",
        },
        409
      );
    }

    /*
    =====================================================
    17. CAPTURE ORDER
    =====================================================
    */

    console.log(
      "Sending PayPal capture request..."
    );

    const captureResponse =
      await fetch(
        `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(
          cleanOrderID
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
            PayPal idempotency header.
            */
            "PayPal-Request-Id":
              `nova-capture-${cleanOrderID}`,
          },

          body:
            JSON.stringify({}),

          cache: "no-store",
        }
      );

    let captureData: any;

    try {
      captureData =
        await readPayPalJson(
          captureResponse
        );
    } catch (
      error
    ) {
      console.error(
        "PayPal capture response parse error:",
        error
      );

      return jsonResponse(
        {
          success: false,

          error:
            "PayPal returned an invalid capture response.",
        },
        502
      );
    }

    console.log(
      "PayPal capture HTTP status:",
      captureResponse.status
    );

    console.log(
      "PayPal capture response:",
      captureData
    );

    /*
    =====================================================
    18. HANDLE CAPTURE HTTP ERROR
    =====================================================
    */

    if (
      !captureResponse.ok
    ) {
      console.error(
        "PayPal capture failed:",
        captureData
      );

      const paymentError =
        getPayPalPaymentError(
          captureData
        );

      return jsonResponse(
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
        captureResponse.status >=
          400 &&
        captureResponse.status <
          500
          ? 400
          : 502
      );
    }

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
      captures[0];

    const captureStatus =
      capture?.status ||
      captureData?.status ||
      null;

    console.log(
      "Actual capture status:",
      captureStatus
    );

    /*
    =====================================================
    20. MUST BE COMPLETED
    =====================================================
    */

    if (
      captureStatus !==
      "COMPLETED"
    ) {
      console.error(
        "Payment was not completed:",
        {
          captureStatus,

          orderID:
            cleanOrderID,

          capture,
        }
      );

      const paymentError =
        getPayPalPaymentError(
          captureData
        );

      return jsonResponse(
        {
          success: false,

          captureStatus,

          status:
            captureData?.status ||
            null,

          paypalIssue:
            paymentError.code,

          error:
            paymentError.message,

          details:
            captureData?.details ||
            null,
        },
        400
      );
    }

    /*
    =====================================================
    21. CAPTURE ID
    =====================================================
    */

    const captureID =
      capture?.id;

    if (
      !captureID
    ) {
      console.error(
        "Capture ID missing:",
        captureData
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          error:
            "PayPal completed the payment, but the capture ID was missing. No Novux were added.",
        },
        500
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

    if (
      paidAmount !==
      packageData.price
    ) {
      console.error(
        "Captured amount mismatch:",
        {
          expected:
            packageData.price,

          received:
            paidAmount,

          orderID:
            cleanOrderID,

          captureID,
        }
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "The captured payment amount does not match the Novux package. No Novux were added.",
        },
        400
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
        "Captured currency mismatch:",
        {
          expected:
            "USD",

          received:
            paidCurrency,

          captureID,
        }
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "The captured payment currency is invalid. No Novux were added.",
        },
        400
      );
    }

    /*
    =====================================================
    24. LOAD CURRENT BALANCE
    =====================================================
    */

    const {
      data: profile,
      error: profileError,
    } =
      await dbClient
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
        "Profile lookup error:",
        profileError
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but your Nova profile could not be loaded. No Novux were added.",
        },
        500
      );
    }

    /*
    =====================================================
    25. CURRENT BALANCE
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
        "Invalid current balance:",
        currentBalance
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Your Nova balance is invalid. No Novux were added.",
        },
        500
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
      "Adding Novux:",
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
    */

    const {
      data: updatedProfile,
      error: updateError,
    } =
      await dbClient
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

    if (
      updateError
    ) {
      console.error(
        "Novux balance update error:",
        updateError
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but Nova could not update your balance. No Novux were added.",
        },
        500
      );
    }

    /*
    =====================================================
    28. ENSURE UPDATE ACTUALLY HAPPENED
    =====================================================
    */

    if (
      !updatedProfile
    ) {
      console.error(
        "Balance update affected zero rows.",
        {
          userID:
            user.id,

          currentBalance,

          newBalance,

          captureID,
        }
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but Nova could not safely update your balance.",
        },
        409
      );
    }

    /*
    =====================================================
    29. VERIFY FINAL BALANCE
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
        "Final balance verification failed:",
        {
          expected:
            newBalance,

          received:
            finalBalance,

          captureID,
        }
      );

      return jsonResponse(
        {
          success: false,

          captureStatus:
            "COMPLETED",

          captureID,

          error:
            "Payment succeeded, but the final Nova balance could not be verified.",
        },
        500
      );
    }

    /*
    =====================================================
    30. SUCCESS LOG
    =====================================================
    */

    console.log(
      "================================="
    );

    console.log(
      "NOVUX PAYMENT SUCCESS"
    );

    console.log(
      "User:",
      user.id
    );

    console.log(
      "Order:",
      cleanOrderID
    );

    console.log(
      "Capture:",
      captureID
    );

    console.log(
      "Package:",
      packageData.novux
    );

    console.log(
      "Paid:",
      paidCurrency,
      paidAmount
    );

    console.log(
      "Previous balance:",
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

    return jsonResponse(
      {
        success: true,

        orderID:
          cleanOrderID,

        captureID,

        status:
          captureData?.status ||
          "COMPLETED",

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
      200
    );
  } catch (
    error
  ) {
    console.error(
      "PayPal Production capture route error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while capturing the PayPal payment.",
      },
      500
    );
  }
}