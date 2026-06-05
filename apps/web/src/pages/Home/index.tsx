import { Card } from '@/components/ui/card';
import {
  ArrowUpRight,
  BookOpen,
  Feather,
  Sparkles
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Link } from 'react-router';

const HomePage = () => {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 w-full items-center">
      <Card className="w-full relative overflow-hidden p-6" size="sm">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-soft blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            <HugeiconsIcon icon={Sparkles} className="h-3 w-3" /> Aktuelle
            Akademie
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Schwäbisch Gmünd 2026-1
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            12 Abschnitte · 8 Beiträge eingereicht · Redaktionsschluss in 14
            Tagen.
          </p>
        </div>
      </Card>

      <section className="w-full grid gap-3 sm:grid-cols-2">
        <ActionCard
          to="/sections"
          icon={Feather}
          title="Beiträge bearbeiten"
          description="Abschnitte ergänzen und Dateien hochladen."
        />
        <ActionCard
          to="/doku"
          icon={BookOpen}
          title="Doku ansehen"
          description="Aktuelle Vorschau der Gesamtausgabe."
        />
      </section>
    </div>
  );
};

export default HomePage;

const ActionCard = ({
  to,
  icon,
  title,
  description
}: {
  to: string;
  icon: IconSvgElement;
  title: string;
  description: string;
}) => {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-soft"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <HugeiconsIcon icon={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <HugeiconsIcon
            icon={ArrowUpRight}
            className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
          />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
};
