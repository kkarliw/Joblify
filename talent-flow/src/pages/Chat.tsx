import { Navigate } from "react-router-dom";

const Chat = () => <Navigate to="/app/talento/mensajes" replace />;

export default Chat;

const Chat = () => {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const active = conversations.find(c => c.id === activeId)!;

  return (
    <AppLayout>
      <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-12rem)] jb-card overflow-hidden">
        {/* Conversations list */}
        <aside className="border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-xl mb-3">Mensajes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar…" className="pl-9 h-9 bg-surface-elevated border-transparent rounded-full" />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left border-b border-border transition-colors",
                    c.id === activeId ? "bg-surface-elevated" : "hover:bg-surface-elevated/50"
                  )}
                >
                  <Avatar initials={c.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{c.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{c.role}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1.5">{c.lastMessage}</div>
                  </div>
                  {c.unread > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{c.unread}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Conversation */}
        <section className="flex flex-col min-w-0">
          <header className="h-16 border-b border-border flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <Avatar initials={active.avatar} size="md" />
              <div>
                <div className="font-semibold text-sm">{active.name}</div>
                <div className="text-xs text-muted-foreground">{active.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="h-9 w-9 rounded-full hover:bg-surface-elevated flex items-center justify-center"><Phone className="h-4 w-4" /></button>
              <button className="h-9 w-9 rounded-full hover:bg-surface-elevated flex items-center justify-center"><Video className="h-4 w-4" /></button>
              <button className="h-9 w-9 rounded-full hover:bg-surface-elevated flex items-center justify-center"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {active.messages.map(m => (
              <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[70%] px-4 py-2.5 text-sm",
                  m.from === "me"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-surface-elevated rounded-2xl rounded-bl-md"
                )}>
                  <div>{m.text}</div>
                  <div className={cn("text-[10px] mt-1", m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t border-border p-4">
            <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
              <Input placeholder="Escribe un mensaje…" className="h-11 bg-surface-elevated border-transparent rounded-full px-5" />
              <button type="submit" className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover flex items-center justify-center shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </footer>
        </section>
      </div>
    </AppLayout>
  );
};

export default Chat;
