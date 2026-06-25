import type { ComponentType, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function classNames(...items: Array<string | false | null | undefined>): string {
  return items.filter(Boolean).join(" ");
}

export function MaterialIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  return <span className="material-symbols-outlined" style={style}>{name}</span>;
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "gold" | "teal" | "danger" }) {
  return <span className={classNames("chip", tone !== "default" && tone)}>{children}</span>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" }) {
  const variants = { primary: "btn-primary", secondary: "btn-secondary", ghost: "btn-ghost", outline: "btn-outline", danger: "btn-danger" };
  return <button className={classNames("btn", variants[variant], className)} {...props}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontWeight: 700, color: "var(--muted)" }}>
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

export function PageHead({ eyebrow, title, children, action }: { eyebrow: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <section className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {children && <p className="lead">{children}</p>}
      </div>
      {action}
    </section>
  );
}

export function Stat({ label, value, icon: Icon }: { label: string; value?: number; icon?: ComponentType<{ className?: string; size?: number; color?: string }> }) {
  return (
    <div className="card stat">
      <div className="meta" style={{ justifyContent: "space-between" }}>
        <Badge tone="teal">{label}</Badge>
        {Icon && <Icon color="var(--primary)" size={20} />}
      </div>
      <strong>{value ?? 0}</strong>
    </div>
  );
}
