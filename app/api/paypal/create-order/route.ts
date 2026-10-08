import { NextResponse } from "next/server";

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

IMPORTANT:
The browser only sends the Novux amount.
The server decides the actual price.

300   -> $3
1000  -> $7
1500  -> $9
2500  -> $15
5000  -> $25
10000 -> $45
=========================================================
*/

const PACKAGES: Record<
  number,
  {
    novux: number;
    price: string;
  }
> = {
  300: {
    novux: 300,
    price: "3.00",
  },

  1000: {
    novux: 1000,
    price: "7.00",
  },

  1500: {
    novux: 1500,
    price: "9.00",
  },

  2500: {
    novux: 2500,
    price: "15.00",
  },

  5000: {
    novux: 5000,
    price: "25.00",
  },

  10000: {
    novux: 10000,
    price: "45.00",
  },
};

/*
=========================================================
JSON RESPONSE
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

        Pragma:
          "no-cache",

        Expires:
          "0",
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
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  const trimmed =
    text.trimStart();

  /*
  -------------------------------------------------------
  PAYPAL RETURNED HTML
  -------------------------------------------------------
  */

  if (
    trimmed.startsWith(
      "<!DOCTYPE"
    ) ||
    trimmed.startsWith(
      "<html"
    )
  ) {
    console.error(
      "PayPal returned HTML instead of JSON:",
      text.slice(
        0,
        1000
      )
    );

    return {
      raw:
        text.slice(
          0,
          1000
        ),
      invalidHtml:
        true,
    };
  }

  /*
  -------------------------------------------------------
  PARSE JSON
  -------------------------------------------------------
  */

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

    return {
      raw:
        text.slice(
          0,
          1000
        ),
      invalidJson:
        true,
    };
  }
}

/*
=========================================================
GET PAYPAL ACCESS TOKEN
=========================================================
*/

async function getPayPalAccessToken() {
  /*
  =======================================================
  LIVE CREDENTIALS
  =======================================================
  */

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
      "PayPal Live credentials are missing on the server."
    );
  }

  /*
  =======================================================
  BASIC AUTH
  =======================================================
  */

  const auth =
    Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString(
      "base64"
    );

  /*
  =======================================================
  OAUTH
  =======================================================
  */

  const response =
    await fetch(
      `${PAYPAL_API}/v1/oauth2/token`,
      {
        method:
          "POST",

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

        cache:
          "no-store",
      }
    );

  const data =
    await readResponse(
      response
    );

  /*
  =======================================================
  INVALID JSON
  =======================================================
  */

  if (
    data?.invalidHtml ||
    data?.invalidJson
  ) {
    console.error(
      "PayPal OAuth returned invalid data:",
      data
    );

    throw new Error(
      "PayPal returned an invalid authentication response."
    );
  }

  /*
  =======================================================
  AUTH FAILURE
  =======================================================
  */

  if (
    !response.ok
  ) {
    console.error(
      "PayPal authentication failed:",
      {
        status:
          response.status,

        data,
      }
    );

    throw new Error(
      data?.error_description ||
        data?.error ||
        data?.message ||
        "Could not authenticate with PayPal."
    );
  }

  /*
  =======================================================
  TOKEN CHECK
  =======================================================
  */

  if (
    !data ||
    typeof data.access_token !==
      "string"
  ) {
    console.error(
      "PayPal did not return access_token:",
      data
    );

    throw new Error(
      "PayPal did not return an access token."
    );
  }

  return data.access_token;
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
  SERVER-SIDE PACKAGE VALIDATION
  =======================================================
  */

  const packageData =
    PACKAGES[novux];

  if (
    !packageData
  ) {
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
  PACKAGE IDENTIFIERS
  =======================================================
  */

  const customId =
    `novux_${packageData.novux}`;

  const referenceId =
    `nova-novux-${packageData.novux}`;

  /*
  =======================================================
  IDEMPOTENCY KEY
  =======================================================

  Keep this short enough for PayPal.
  =======================================================
  */

  const paypalRequestId =
    `nova-${packageData.novux}-${Date.now()}`;

  /*
  =======================================================
  CREATE ORDER
  =======================================================
  */

  const orderResponse =
    await fetch(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "PayPal-Request-Id":
            paypalRequestId,
        },

        body:
          JSON.stringify(
            {
              intent:
                "CAPTURE",

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
                      packageData.price,
                  },
                },
              ],
            }
          ),

        cache:
          "no-store",
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

  console.log(
    "PayPal Create Order HTTP status:",
    orderResponse.status
  );

  /*
  =======================================================
  INVALID RESPONSE
  =======================================================
  */

  if (
    orderData?.invalidHtml ||
    orderData?.invalidJson
  ) {
    console.error(
      "PayPal Create Order returned invalid data:",
      orderData
    );

    throw new Error(
      "PayPal returned an invalid order response."
    );
  }

  /*
  =======================================================
  PAYPAL ERROR
  =======================================================
  */

  if (
    !orderResponse.ok
  ) {
    console.error(
      "PayPal Create Order failed:",
      {
        status:
          orderResponse.status,

        statusText:
          orderResponse.statusText,

        data:
          orderData,
      }
    );

    const paypalMessage =
      orderData?.details?.[0]
        ?.description ||
      orderData?.message ||
      orderData?.error_description ||
      orderData?.error;

    throw new Error(
      paypalMessage ||
        "PayPal could not create the order."
    );
  }

  /*
  =======================================================
  ORDER ID
  =======================================================
  */

  const orderID =
    orderData?.id;

  if (
    !orderID ||
    typeof orderID !==
      "string"
  ) {
    console.error(
      "PayPal order ID is missing:",
      orderData
    );

    throw new Error(
      "PayPal did not return an order ID."
    );
  }

  /*
  =======================================================
  VERIFY ORDER STATUS
  =======================================================
  */

  const orderStatus =
    orderData?.status;

  console.log(
    "PayPal Order ID:",
    orderID
  );

  console.log(
    "PayPal Order Status:",
    orderStatus
  );

  /*
  =======================================================
  LOG PURCHASE
  =======================================================
  */

  console.log(
    "================================="
  );

  console.log(
    "PAYPAL PRODUCTION ORDER CREATED"
  );

  console.log(
    "Order ID:",
    orderID
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
    "Currency:",
    "USD"
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

      orderID,

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

    status:

      orderStatus ||
      null,
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
    READ REQUEST BODY
    =====================================================
    */

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Invalid JSON request body.",
        },
        400
      );
    }

    /*
    =====================================================
    VALIDATE BODY
    =====================================================
    */

    const rawNovux =
      body?.novux;

    if (
      rawNovux ===
        undefined ||
      rawNovux ===
        null
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Novux amount is required.",
        },
        400
      );
    }

    /*
    =====================================================
    CONVERT TO NUMBER
    =====================================================
    */

    const novux =
      Number(
        rawNovux
      );

    /*
    =====================================================
    VALIDATE NUMBER
    =====================================================
    */

    if (
      !Number.isFinite(
        novux
      ) ||
      !Number.isInteger(
        novux
      ) ||
      novux <=
        0
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "Invalid Novux amount.",
        },
        400
      );
    }

    /*
    =====================================================
    VALIDATE PACKAGE
    =====================================================
    */

    if (
      !PACKAGES[novux]
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "This Novux package does not exist.",
        },
        400
      );
    }

    /*
    =====================================================
    CREATE PAYPAL ORDER
    =====================================================
    */

    const result =
      await createPayPalOrder(
        novux
      );

    /*
    =====================================================
    SUCCESS
    =====================================================
    */

    return jsonResponse(
      {
        success:
          true,

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

        status:
          result.status,
      },
      200
    );
  } catch (
    error
  ) {
    /*
    =====================================================
    SERVER ERROR
    =====================================================
    */

    console.error(
      "================================="
    );

    console.error(
      "PAYPAL CREATE ORDER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return jsonResponse(
      {
        success:
          false,

        error:
          error instanceof
          Error
            ? error.message
            : "Something went wrong while creating the PayPal order.",
      },
      500
    );
  }
}