import { Pencil, MapPin, Mail, Link2, Briefcase, GraduationCap, Award } from "lucide-react";
import { AppLayout } from "@/components/Layouts";
import { Avatar } from "@/components/Brand";
import { Button } from "@/components/ui/button";

const Profile = () => {
  return (
    <AppLayout>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          {/* Header card */}
          <div className="bg-white border border-border rounded-2xl p-7 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar initials="AC" size="xl" />
              <div className="flex-1 w-full">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Andrea Castillo</h1>
                    <p className="text-muted-foreground mt-1 font-sans">Senior Product Designer · 7 años de experiencia</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-sans">
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Ciudad de México</span>
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> andrea@joblify.com</span>
                      <span className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> andreacastillo.design</span>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl font-subtitle"><Pencil className="h-4 w-4" /> Editar</Button>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Product Design", "Design Systems", "User Research", "Figma", "Workshops"].map(s => (
                    <span key={s} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/15 font-sans">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white border border-border rounded-2xl p-7">
            <h2 className="font-display text-xl font-bold mb-3">Sobre mí</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              Diseñadora con más de 7 años creando productos digitales para fintech y delivery en LATAM.
              Especializada en design systems y procesos de research que escalan.
              Mentora en Platzi y speaker en conferencias de la región.
            </p>
          </div>

          {/* Experience timeline */}
          <div className="bg-white border border-border rounded-2xl p-7">
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2"><Briefcase className="h-5 w-5" /> Experiencia</h2>
            <div className="relative pl-6 space-y-7">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {[
                { role: "Senior Product Designer", company: "Nubank · México", time: "2022 – Actual", desc: "Lidero el equipo de diseño del producto de tarjetas. Reduje el time-to-design 40%." },
                { role: "Product Designer", company: "Rappi · Colombia", time: "2019 – 2022", desc: "Diseñé el flow de checkout que aumentó la conversión 18%." },
                { role: "UX Designer", company: "Platzi · Remoto", time: "2017 – 2019", desc: "Onboarding y experiencia de cursos. Crecí mi rol de junior a lead." },
              ].map((e, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  <div className="text-xs text-muted-foreground font-sans">{e.time}</div>
                  <h3 className="font-subtitle font-semibold mt-1">{e.role}</h3>
                  <p className="text-sm text-muted-foreground font-sans">{e.company}</p>
                  <p className="text-sm mt-2 font-sans">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white border border-border rounded-2xl p-7">
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Educación</h2>
            <div className="space-y-5">
              {[
                { title: "Diseño Industrial", inst: "UNAM", time: "2013 – 2017" },
                { title: "Master Interaction Design", inst: "IED Barcelona", time: "2018" },
              ].map(e => (
                <div key={e.title} className="flex items-start justify-between">
                  <div>
                    <div className="font-subtitle font-semibold">{e.title}</div>
                    <div className="text-sm text-muted-foreground font-sans">{e.inst}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-sans">{e.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-subtitle font-semibold">Perfil completado</span>
              <span className="font-display text-2xl font-bold">87%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "87%" }} />
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-sans">Sube tu portafolio para llegar al 100%.</p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-subtitle font-semibold text-sm flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Logros</h3>
            <ul className="mt-4 space-y-3 text-sm font-sans">
              <li>🏆 Top 50 Designers LATAM 2023</li>
              <li>🎤 Speaker · Config 2022</li>
              <li>📚 Autora · "Sistemas que escalan"</li>
            </ul>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-subtitle font-semibold text-sm">Estadísticas</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-display text-2xl font-bold">142</div>
                <div className="text-xs text-muted-foreground font-sans">Vistas perfil</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">28</div>
                <div className="text-xs text-muted-foreground font-sans">Recruiters</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
};

export default Profile;
