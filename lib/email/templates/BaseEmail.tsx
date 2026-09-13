import type { ReactNode } from "react";
export function BaseEmail({
  eyebrow,
  title,
  children,
  cta,
  href,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  cta: string;
  href: string;
}) {
  return (
    <div
      style={{
        background: "#0a0f1e",
        padding: "32px",
        fontFamily: "Arial,sans-serif",
        color: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#111827",
          border: "1px solid #263247",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 24, borderBottom: "1px solid #263247" }}>
          <b style={{ color: "#00f5d4", fontSize: 22 }}>✦ IBF</b>
        </div>
        <div style={{ padding: 32 }}>
          <p
            style={{
              color: "#00f5d4",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>
          <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>{title}</h1>
          <div style={{ color: "#b5c0d0", fontSize: 15, lineHeight: 1.7 }}>
            {children}
          </div>
          <a
            href={href}
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "12px 20px",
              background: "#00f5d4",
              color: "#07110f",
              fontWeight: 700,
              borderRadius: 9,
              textDecoration: "none",
            }}
          >
            {cta}
          </a>
        </div>
        <div
          style={{
            padding: "16px 32px",
            color: "#718096",
            fontSize: 11,
            borderTop: "1px solid #263247",
          }}
        >
          Innovator Bridge Foundry · Build what matters, together.
        </div>
      </div>
    </div>
  );
}
