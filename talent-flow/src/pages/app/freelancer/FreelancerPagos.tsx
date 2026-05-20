import { PageHeader } from "@/components/PageHeader";
import { Wallet, Download, ArrowDownToLine, TrendingUp } from "lucide-react";

const txs = [
  { id: "1", desc: "Pago — Crehana", date: "5 May 2026", amount: "+USD 1,200", status: "Liberado" },
  { id: "2", desc: "Pago — Tienda Nube", date: "28 Abr 2026", amount: "+USD 900", status: "En custodia" },
  { id: "3", desc: "Retiro a banco", date: "20 Abr 2026", amount: "−USD 2,400", status: "Completado" },
  { id: "4", desc: "Pago — Globant", date: "12 Abr 2026", amount: "+USD 2,000", status: "Liberado" },
  { id: "5", desc: "Comisión Joblify", date: "12 Abr 2026", amount: "−USD 100", status: "Completado" },
];

const FreelancerPagos = () => (
  <div>
    <PageHeader eyebrow="Finanzas" title="Pagos y ganancias" subtitle="Tus cobros, retiros y ganancias en custodia." action={
      <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-sm font-subtitle font-semibold">
        <ArrowDownToLine className="h-4 w-4" /> Retirar fondos
      </button>
    }/>

    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <Wallet className="h-5 w-5 text-primary" />
        <p className="mt-3 font-display text-3xl font-bold">USD 3,200</p>
        <p className="text-xs text-muted-foreground font-sans">Disponible para retirar</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <TrendingUp className="h-5 w-5 text-primary" />
        <p className="mt-3 font-display text-3xl font-bold">USD 900</p>
        <p className="text-xs text-muted-foreground font-sans">En custodia</p>
      </div>
      <div className="rounded-2xl border border-border bg-foreground text-background p-5">
        <p className="text-[10px] font-subtitle font-semibold uppercase tracking-wider text-background/60">Total 2026</p>
        <p className="mt-3 font-display text-3xl font-bold">USD 12,840</p>
        <p className="text-xs text-background/60 font-sans">+18% vs trimestre anterior</p>
      </div>
    </div>

    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-subtitle font-semibold">Movimientos</h2>
        <button className="text-xs font-subtitle font-semibold inline-flex items-center gap-1 hover:text-primary">
          <Download className="h-3 w-3" /> Exportar CSV
        </button>
      </div>
      <ul className="divide-y divide-border">
        {txs.map(t => (
          <li key={t.id} className="p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-subtitle font-semibold">{t.desc}</p>
              <p className="text-xs text-muted-foreground font-sans">{t.date}</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-subtitle font-semibold uppercase ${
              t.status === "En custodia" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"
            }`}>{t.status}</span>
            <span className={`text-sm font-subtitle font-semibold w-24 text-right ${t.amount.startsWith("+") ? "text-emerald-600" : "text-foreground"}`}>{t.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default FreelancerPagos;
