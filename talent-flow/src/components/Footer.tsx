import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const productLinks = [
  { label: "Vacantes", to: "/vacantes" },
  { label: "Freelance", to: "/freelancer" },
  { label: "Para empresas", to: "/publicar" },
  { label: "AI Recruiter", to: "/chat" },
];

const companyLinks = [
  { label: "Nosotros", to: "#" },
  { label: "Blog", to: "#" },
  { label: "Precios", to: "#" },
  { label: "Contacto", to: "#" },
];

const legalLinks = [
  { label: "Privacidad", to: "#" },
  { label: "Términos", to: "#" },
  { label: "Cookies", to: "#" },
];

const socials = [
  { label: "LinkedIn", to: "#" },
  { label: "X", to: "#" },
  { label: "Instagram", to: "#" },
  { label: "GitHub", to: "#" },
];

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14 md:py-20">
        {/* Top: brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Logo size="lg" variant="dark" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground font-sans leading-relaxed">
              Conectando talento con oportunidades reales. IA que entiende tu carrera, no solo tu CV.
            </p>
          </div>

          {/* Product */}
          <div className="md:col-span-2 md:col-start-6">
            <p className="font-subtitle font-semibold text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">
              Producto
            </p>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm font-sans text-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <p className="font-subtitle font-semibold text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">
              Compañía
            </p>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm font-sans text-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <p className="font-subtitle font-semibold text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">
              Legal
            </p>
            <ul className="space-y-3">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm font-sans text-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: copyright + socials */}
        <div className="mt-12 md:mt-16 pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-sans">
            © {year} Joblify · Hecho con IA en LATAM.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <Link
                  to={s.to}
                  className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};
