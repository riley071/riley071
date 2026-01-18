import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface EmailItem {
  beatTitle: string;
  licenseType: string;
  price: number;
}

interface EmailPayload {
  userEmail: string;
  userName: string | null;
  order: {
    id: string;
    total_amount: number;
    created_at?: string;
  };
  items: EmailItem[];
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Nsimabeats <no-reply@nsimabeats.com>";

  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    return new Response("Email service not configured", { status: 500 });
  }

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Invalid JSON payload:", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  const { userEmail, userName, order, items } = payload;

  if (!userEmail || !order || !items || !Array.isArray(items)) {
    return new Response("Missing required fields", { status: 400 });
  }

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString()
    : new Date().toLocaleString();

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0;">${item.beatTitle}</td>
          <td style="padding: 8px 0; text-transform: capitalize;">${item.licenseType}</td>
          <td style="padding: 8px 0; text-align: right;">MK ${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Thank you for your purchase${
        userName ? ", " + userName : ""
      }!</h1>
      <p style="margin: 0 0 16px 0;">Your order has been completed and your beats are now available in your Nsimabeats dashboard.</p>

      <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 8px 0;">Order Summary</h2>
      <p style="margin: 0 0 4px 0;">Order ID: <strong>${order.id}</strong></p>
      <p style="margin: 0 0 12px 0;">Date: ${formattedDate}</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Beat</th>
            <th style="text-align: left; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">License</th>
            <th style="text-align: right; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top: 12px; font-weight: 600; text-align: right;">Total</td>
            <td style="padding-top: 12px; font-weight: 700; text-align: right;">MK ${order.total_amount.toFixed(
              2,
            )}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin: 24px 0 8px 0;">
        You can download your beats and license documents anytime from your dashboard:
      </p>
      <p style="margin: 0 0 16px 0;">
        <a href="https://nsimabeats.com/dashboard" style="color: #facc15; font-weight: 600; text-decoration: none;">
          Go to my dashboard
        </a>
      </p>

      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
        If you did not make this purchase or believe this email was sent in error, please contact support immediately.
      </p>
    </div>
  `;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [userEmail],
        subject: `Your Nsimabeats order ${order.id}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      return new Response("Failed to send email", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calling Resend API:", error);
    return new Response("Failed to send email", { status: 500 });
  }
});


