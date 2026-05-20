import { SocialFeed } from "@/components/SocialFeed";
import { PageHeader } from "@/components/PageHeader";
import { type UserRole } from "@/store/authStore";

const FeedPage = ({ role }: { role: UserRole }) => (
  <div>
    <PageHeader eyebrow="Comunidad Joblify" title="Feed social" subtitle="Conecta con talento, comparte logros y descubre oportunidades en tiempo real." />
    <SocialFeed role={role} />
  </div>
);

export default FeedPage;
