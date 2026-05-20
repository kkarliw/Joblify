export { default } from "./app/empresa/EmpresaPipeline";

const stages: Candidate["stage"][] = ["Nuevo", "Screening", "Entrevista", "Oferta", "Contratado"];

const Pipeline = () => {
  return (
    <AppLayout>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Pipeline</h1>
          <p className="mt-2 text-muted-foreground">Senior Product Designer · 6 candidatos activos</p>
        </div>
        <button className="h-10 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Mover candidato
        </button>
      </div>

      <div className="mt-8 grid grid-cols-5 gap-4 min-h-[600px]">
        {stages.map(stage => {
          const items = candidates.filter(c => c.stage === stage);
          return (
            <div key={stage} className="bg-surface-elevated/50 rounded-xl p-3 border border-border flex flex-col">
              <div className="flex items-center justify-between px-2 py-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider">{stage}</h3>
                <span className="text-xs font-semibold text-muted-foreground">{items.length}</span>
              </div>
              <div className="mt-3 space-y-2.5 flex-1">
                {items.map(c => (
                  <div key={c.id} className="bg-card border border-border rounded-lg p-3.5 hover:border-foreground transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={c.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.title}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-primary/15">{c.match}%</div>
                      <div className="text-[10px] text-muted-foreground">{c.experience}</div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">Sin candidatos</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
