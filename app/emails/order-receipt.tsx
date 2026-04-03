import React from "react";

interface OrderReceiptProps {
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

export const OrderReceipt = ({
  orderRef,
  customerName,
  customerEmail,
  items,
  subtotal,
  tax,
  total,
  shippingAddress,
  trackingUrl,
}: OrderReceiptProps) => {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        backgroundColor: "#0a0e27",
        color: "#00ff88",
        padding: "40px 20px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Glitch Header */}
      <div
        style={{
          marginBottom: "40px",
          borderBottom: "2px solid #00ff88",
          paddingBottom: "20px",
        }}
      >
        <h1
          style={{
            margin: "0 0 10px 0",
            fontSize: "32px",
            textTransform: "uppercase",
            letterSpacing: "3px",
            textShadow: "2px 2px #ff00ff, -2px -2px #00ffff",
          }}
        >
          GLITCHED
        </h1>
        <p
          style={{
            margin: "0",
            fontSize: "12px",
            opacity: 0.7,
            letterSpacing: "2px",
          }}
        >
          {"// ORDER CONFIRMATION RECEIVED"}
        </p>
      </div>

      {/* Order Reference */}
      <div style={{ marginBottom: "30px" }}>
        <p style={{ margin: "0 0 5px 0", fontSize: "12px", opacity: 0.7 }}>
          ORDER #
        </p>
        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "1px",
          }}
        >
          {orderRef}
        </p>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: "30px" }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "12px", opacity: 0.7 }}>
          {"// CUSTOMER"}
        </p>
        <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>{customerName}</p>
        <p style={{ margin: "0 0 15px 0", fontSize: "12px", opacity: 0.8 }}>
          {customerEmail}
        </p>
      </div>

      {/* Shipping Address */}
      <div style={{ marginBottom: "30px" }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "12px", opacity: 0.7 }}>
          {"// SHIPPING TO"}
        </p>
        <div style={{ fontSize: "12px", lineHeight: "1.8" }}>
          <p style={{ margin: "0" }}>{shippingAddress.line1}</p>
          {shippingAddress.line2 && (
            <p style={{ margin: "0" }}>{shippingAddress.line2}</p>
          )}
          <p style={{ margin: "0" }}>
            {shippingAddress.city}, {shippingAddress.state}{" "}
            {shippingAddress.postalCode}
          </p>
          <p style={{ margin: "0" }}>{shippingAddress.country}</p>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px dashed #00ff88",
          margin: "30px 0",
          opacity: 0.5,
        }}
      />

      {/* Order Items */}
      <div style={{ marginBottom: "30px" }}>
        <p style={{ margin: "0 0 15px 0", fontSize: "12px", opacity: 0.7 }}>
          {"// ITEMS ORDERED"}
        </p>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
              fontSize: "13px",
              borderBottom: "1px solid #00ff8822",
              paddingBottom: "12px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 4px 0" }}>{item.name}</p>
              <p style={{ margin: "0", opacity: 0.7, fontSize: "11px" }}>
                qty: {item.quantity}
              </p>
            </div>
            <p style={{ margin: "0", textAlign: "right" }}>
              {formatPrice(item.unitAmount * item.quantity, item.currency)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px dashed #00ff88",
          margin: "30px 0",
          opacity: 0.5,
        }}
      />

      {/* Totals */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          <span>Subtotal:</span>
          <span>{formatPrice(subtotal, "USD")}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          <span>Tax:</span>
          <span>{formatPrice(tax, "USD")}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "16px",
            fontWeight: "bold",
            paddingTop: "10px",
            borderTop: "2px solid #00ff88",
          }}
        >
          <span>TOTAL:</span>
          <span>{formatPrice(total, "USD")}</span>
        </div>
      </div>

      {/* Tracking (if available) */}
      {trackingUrl && (
        <>
          <div
            style={{
              borderTop: "1px dashed #00ff88",
              margin: "30px 0",
              opacity: 0.5,
            }}
          />
          <div style={{ marginBottom: "30px", textAlign: "center" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "12px", opacity: 0.7 }}>
              {"// TRACK YOUR SHIPMENT"}
            </p>
            <a
              href={trackingUrl}
              style={{
                display: "inline-block",
                padding: "10px 20px",
                backgroundColor: "#00ff88",
                color: "#0a0e27",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
                borderRadius: "2px",
              }}
            >
              VIEW TRACKING
            </a>
          </div>
        </>
      )}

      {/* Footer */}
      <div
        style={{
          borderTop: "2px solid #00ff88",
          paddingTop: "20px",
          marginTop: "40px",
          fontSize: "10px",
          opacity: 0.6,
          textAlign: "center",
          lineHeight: "1.8",
        }}
      >
        <p style={{ margin: "0" }}>{"// THANK YOU FOR YOUR PURCHASE"}</p>
        <p style={{ margin: "0" }}>{"// GLITCHED.STORE"}</p>
        <p style={{ margin: "8px 0 0 0" }}>
          Questions? Email us at support@glitched.store
        </p>
      </div>
    </div>
  );
};
