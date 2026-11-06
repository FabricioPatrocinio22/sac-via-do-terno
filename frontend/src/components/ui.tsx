import React, { useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, X, Check, FileText } from "lucide-react";

// Cores Oficiais Via do Terno (Idênticas ao CRM)
export const C = {
  bg: "#F4F5F8",
  surface: "#FFFFFF",
  ink: "#18181B",
  inkSoft: "#64748B",

  wine: "#C8102E",         // Vermelho Oficial Via do Terno
  wineHover: "#A50D25",
  wineDark: "#141416",     // Preto Ônix / Alfaiataria (Sidebar)
  wineSoft: "#FEE8E8",     // Fundo vermelho suave

  gold: "#C5A059",         // Dourado do Brasão Via do Terno
  goldSoft: "#FEF9EE",

  border: "#E2E8F0",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  grayBadge: "#475569",
  graySoft: "#F1F5F9",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  info: "#2563EB",
  infoSoft: "#EFF6FF",
  purple: "#7C3AED",
  purpleSoft: "#F5F3FF",
  cyan: "#0891B2",
  cyanSoft: "#ECFEFF",
};

// Compatibilidade com os componentes do SAC
export const BRAND = {
  ink: C.ink,
  canvas: C.bg,
  card: C.surface,
  navy: C.wineDark,
  navySoft: "#222226",
  wine: C.wine,
  wineSoft: C.wineSoft,
  brass: C.gold,
  brassSoft: C.goldSoft,
  border: C.border,
  slate: C.inkSoft,
  success: C.success,
  successBg: C.successSoft,
  warning: C.amber,
  warningBg: C.amberSoft,
  danger: C.danger,
  dangerBg: C.dangerSoft,
  info: C.info,
  infoBg: C.infoSoft,
};

export const FONT_DISPLAY = "'Fraunces', Georgia, serif";
export const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

export const LOGO_URL = "https://viadoterno.cdn.magazord.com.br/resources/LOGO%20HORIZONTAL%20VIA.png";
export const LOGO_COMPACT_URL = "https://viadoterno.cdn.magazord.com.br/img/2026/02/logo/3331/logo-via-do-terno.png";
export const WHATSAPP_ICON_URL = "https://viadoterno.cdn.magazord.com.br/img/2026/08/logo/5168/whatsapp.png";

export function fmtCurrency(v: number | null | undefined) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("pt-BR");
}

export function fmtDateTime(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function buildWhatsAppLink(phoneRaw?: string, clientName?: string, protocolo?: string) {
  const digits = String(phoneRaw || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  const msg = protocolo
    ? `Olá ${clientName || ""}, tudo bem? Aqui é da equipe de Pós-Venda (SAC) da Via do Terno referente ao protocolo *${protocolo}*.`
    : `Olá ${clientName || ""}, tudo bem? Aqui é da equipe da Via do Terno.`;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

export function colorSet(name: string) {
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    success: { bg: C.successSoft, fg: C.success, border: "#BBF7D0" },
    warning: { bg: C.amberSoft, fg: C.amber, border: "#FDE68A" },
    danger: { bg: C.dangerSoft, fg: C.danger, border: "#FECACA" },
    info: { bg: C.infoSoft, fg: C.info, border: "#BFDBFE" },
    wine: { bg: C.wineSoft, fg: C.wine, border: "#FCA5A5" },
    gold: { bg: C.goldSoft, fg: "#9A732E", border: "#FDE68A" },
  };
  return map[name] || map.info;
}

export function Badge({ children, tone = "info" }: { children: React.ReactNode; tone?: string }) {
  const c = colorSet(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 700,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function ProtocolTag({ protocolo }: { protocolo: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: FONT_MONO,
        fontSize: 12,
        fontWeight: 600,
        color: C.wineDark,
        background: C.goldSoft,
        border: `1px solid ${C.gold}66`,
        borderRadius: 6,
        padding: "3px 9px",
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: C.wine,
          flexShrink: 0,
        }}
      />
      {protocolo}
    </span>
  );
}

export function Card({
  children,
  style,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        ...style,
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            padding: style?.padding === 0 ? "18px 20px 0" : 0,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: FONT_SANS }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// Card KPI no mesmo padrão visual do CRM Via do Terno (borda superior colorida + ícone + valor)
export function KpiCard({
  label,
  value,
  sub,
  trend,
  accent = C.wine,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  accent?: string;
  icon?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderTop: `4px solid ${accent}`,
        borderRadius: 10,
        padding: "14px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
        {icon && (
          <span
            style={{
              background: `${accent}15`,
              padding: "2px 6px",
              borderRadius: 6,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: C.ink,
          marginTop: 6,
          fontFamily: FONT_SANS,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11.5,
            color: trend === "up" ? C.success : trend === "down" ? C.danger : C.inkSoft,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: trend ? 600 : 400,
          }}
        >
          {trend === "up" && <ArrowUpRight size={13} />}
          {trend === "down" && <ArrowDownRight size={13} />}
          {trend === "flat" && <Minus size={13} />}
          {sub}
        </div>
      )}
    </div>
  );
}

type BtnVariant = "primary" | "brass" | "gold" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  onClick,
  variant = "secondary",
  size = "md",
  icon: Icon,
  style,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: "sm" | "md";
  icon?: any;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    fontFamily: FONT_SANS,
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s ease",
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12.5 },
    md: { padding: "9px 16px", fontSize: 13.5 },
  };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: {
      background: C.wine,
      color: "#fff",
      borderColor: C.wine,
      boxShadow: "0 2px 4px rgba(200, 16, 46, 0.25)",
    },
    brass: {
      background: C.wine,
      color: "#fff",
      borderColor: C.wine,
      boxShadow: "0 2px 4px rgba(200, 16, 46, 0.25)",
    },
    gold: {
      background: C.gold,
      color: "#fff",
      borderColor: C.gold,
    },
    secondary: {
      background: "#fff",
      color: C.ink,
      borderColor: C.border,
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    },
    ghost: {
      background: "transparent",
      color: C.inkSoft,
      borderColor: "transparent",
    },
    danger: {
      background: C.dangerSoft,
      color: C.danger,
      borderColor: "#FECACA",
    },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13 }}>
      <span style={{ fontWeight: 600, color: C.inkSoft, fontSize: 12 }}>
        {label} {required && <span style={{ color: C.wine }}>*</span>}
      </span>
      {children}
      {hint && <span style={{ fontSize: 11.5, color: C.inkSoft }}>{hint}</span>}
    </label>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 7,
  border: `1px solid ${C.border}`,
  fontSize: 13,
  color: C.ink,
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: FONT_SANS,
  transition: "border-color 0.15s ease",
};

export function TInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function TSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {children}
    </select>
  );
}

export function TTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, minHeight: 80, resize: "vertical", ...(props.style || {}) }}
    />
  );
}

export function EmptyState({
  title,
  body,
  icon: Icon = FileText,
}: {
  title: string;
  body: string;
  icon?: any;
}) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: C.inkSoft }}>
      <Icon size={30} style={{ opacity: 0.45, margin: "0 auto 10px", display: "block", color: C.wine }} />
      <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{body}</div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 15, 18, 0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 16px",
        zIndex: 60,
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          width,
          maxWidth: "100%",
          maxHeight: "82vh",
          overflow: "auto",
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            background: "#FAFAFA",
          }}
        >
          <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: C.ink }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function Toast({
  message,
  onDone,
}: {
  message: string;
  tone?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 22,
        right: 22,
        background: C.wineDark,
        color: "#fff",
        padding: "11px 18px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderLeft: `4px solid ${C.wine}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
      }}
    >
      <Check size={16} color={C.gold} /> {message}
    </div>
  );
}
