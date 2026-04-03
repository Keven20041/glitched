import { Resend } from "resend";
import { OrderReceipt } from "../emails/order-receipt";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendReceiptEmailParams {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    unitAmount: number;
    currency: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  trackingUrl?: string;
}

export async function sendReceiptEmail(params: SendReceiptEmailParams) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return { success: false, error: "RESEND_API_KEY not set" };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "orders@glitched.store";

    const emailComponent = React.createElement(OrderReceipt, params);

    const result = await resend.emails.send({
      from: fromEmail,
      to: params.customerEmail,
      subject: `Order Confirmation #${params.orderRef} - GLITCHED`,
      react: emailComponent,
    });

    if (result.error) {
      console.error("Failed to send receipt email:", result.error);
      return { success: false, error: result.error };
    }

    console.log("Receipt email sent:", result.data?.id);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return { success: false, error: String(error) };
  }
}
