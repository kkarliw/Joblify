export { default } from "./app/empresa/EmpresaCandidatos";

const Candidatos = () => {
  const sorted = [...candidates].sort((a, b) => b.match - a.match);
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Candidatos</h1>
          <p className="mt-2 text-muted-foreground">Ranking IA para "Senior Product Designer · Bogotá"</p>
        </div>
        <Button variant="outline" className="rounded-full">Exportar CSV</Button>
      </div>

      <div className="mt-8 jb-card overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-surface-elevated/40">
          <div className="col-span-5">Candidato</div>
          <div className="col-span-2">Experiencia</div>
          <div className="col-span-3">Match</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        <ul>
          {sorted.map((c, i) => (
            <li key={c.id} className="grid grid-cols-12 items-center px-6 py-5 border-b border-border last:border-0 hover:bg-surface-elevated/40 transition-colors">
              <div className="col-span-5 flex items-center gap-4">
                <span className="font-display font-bold text-muted-foreground w-6 text-sm">#{i + 1}</span>
                <Avatar initials={c.avatar} size="md" />
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</div>
                </div>
              </div>
              <div className="col-span-2 text-sm">{c.experience}</div>
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <progress
                    value={c.match}
                    max={100}
                    className="flex-1 h-1.5 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-surface-elevated [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                  />
                  <span className="font-display font-bold text-sm w-10">{c.match}%</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated">{s}</span>
                  ))}
                </div>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button 
                  onClick={() => navigate(`/app/empresa/perfil/${c.id}`)}
                  variant="outline" size="icon" className="h-9 w-9 rounded-full"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => navigate(`/app/empresa/perfil/${c.id}`)}
                  size="sm" className="h-9 px-4 rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Ver perfil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
};

export default Candidatos;
