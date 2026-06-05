import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatAcademyDateRange, formatAcademyName } from '@/utils/academy';
import { useUser } from '@/utils/auth';
import { trpc, useAuthStore, useNullableSelectedAcademy } from '@/utils/trpc';
import {
  getInitials,
  userRoleToLongString,
  userRoleToString
} from '@/utils/user';
import { Location, Logout, Mail, Shield } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';

const ProfilePage = () => {
  const authState = useAuthStore();
  const user = useUser();

  const selectedAcademy = useNullableSelectedAcademy();
  console.log('selectedAcademy', selectedAcademy);
  const academiesQuery = useQuery(trpc.academy.getSelectable.queryOptions());

  return (
    <div className="flex flex-col gap-8 p-8">
      <section className="w-full">
        <Card size="sm" className="flex-row px-5 items-center">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            {userRoleToString(user.userRole)}
          </span>
        </Card>
      </section>

      <section className="w-full flex flex-col">
        <h3 className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Konto
        </h3>
        <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <Row icon={Mail} label="E-Mail" value={user.email ?? '-'} />
          <Row
            icon={Shield}
            label="Rolle"
            value={userRoleToLongString(user.userRole)}
          />
        </ul>
      </section>

      <section>
        <h3 className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Akademien
        </h3>
        <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {academiesQuery.data?.map((academy) => (
            <Row
              className={cn(
                academy.id === selectedAcademy && 'border border-primary-soft'
              )}
              icon={Location}
              value={formatAcademyName(academy)}
              subtitle={formatAcademyDateRange(academy)}
            />
          ))}
        </ul>
      </section>

      <Button size="lg" className="w-min" onClick={() => authState.logout()}>
        <HugeiconsIcon icon={Logout} />
        Logout
      </Button>
    </div>
  );
};

export default ProfilePage;

const Row = ({
  icon,
  label,
  value,
  subtitle,
  className
}: {
  icon?: IconSvgElement;
  label?: string;
  value: string;
  subtitle?: string;
  className?: string;
}) => {
  return (
    <li
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0',
        className
      )}
    >
      {icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <HugeiconsIcon icon={icon} className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        )}
        <p className="truncate text-sm font-medium">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </li>
  );
};
