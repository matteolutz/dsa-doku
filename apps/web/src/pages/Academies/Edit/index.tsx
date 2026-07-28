import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { formatAcademyDateRange, formatAcademyName } from '@/utils/academy';
import { queryClient, trpc } from '@/utils/trpc';
import { ChevronLeft, GraduationCap, Plus } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { AcademyMeta } from '@repo/db/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

type NewCourseFormInput = {
  courseIdx: string;

  title: string;
  subtitle: string;
};

export const EditAcademyPage = () => {
  // get id param from route
  const { id } = useParams();

  const navigate = useNavigate();

  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({ academyId: Number(id) })
  );

  console.log(academyQuery.data);

  const [newCourseFormOpen, setNewCourseFormOpen] = useState(false);
  const newCourseForm = useForm<NewCourseFormInput>();
  const newCourseMutation = useMutation(
    trpc.course.create.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.academy.getWithCourses.queryKey({
            academyId: Number(id)
          })
        })
    })
  );

  useEffect(() => {
    if (!newCourseFormOpen) newCourseForm.reset();
  }, [newCourseFormOpen, newCourseForm]);

  const onNewCourseSubmit = async (data: NewCourseFormInput) => {
    await newCourseMutation.mutateAsync({
      academyId: Number(id),
      courseIdx: Number(data.courseIdx),
      title: data.title,
      subtitle: data.subtitle
    });

    setNewCourseFormOpen(false);
  };

  return (
    <div className="size-full p-4 flex justify-center relative">
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            className="cursor-pointer"
            size="icon"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {academyQuery.data ? (
                formatAcademyName(academyQuery.data)
              ) : (
                <Skeleton className="w-50 h-10" />
              )}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground tracking-tight">
              {academyQuery.data ? (
                <div className="flex gap-3">
                  <span>{formatAcademyDateRange(academyQuery.data)}</span>
                  <span>
                    {
                      (academyQuery.data.meta as AcademyMeta).doku
                        .coverPageDetailedLocation
                    }
                  </span>
                </div>
              ) : (
                <Skeleton className="w-30 h-5" />
              )}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight">Kurse</h3>

          <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {academyQuery.data?.courses.map((course) => (
              <Row
                icon={GraduationCap}
                key={course.id}
                value={`${academyQuery.data?.yearIdx}.${course.courseIdx} ${course.title}`}
                subtitle={course.subtitle}
              />
            ))}

            <Dialog
              open={newCourseFormOpen}
              onOpenChange={setNewCourseFormOpen}
            >
              <DialogTrigger asChild>
                <button className="cursor-pointer flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 hover:border-primary-soft">
                  <HugeiconsIcon className="size-4" icon={Plus} />
                  <p className="text-sm">Neuen Kurs erstellen</p>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Kurs erstellen</DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={newCourseForm.handleSubmit(onNewCourseSubmit)}
                  className="grid gap-6"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="courseIdx">Kursnummer</Label>
                    <Input
                      id="courseIdx"
                      type="number"
                      placeholder="z.B. 2"
                      min={1}
                      defaultValue={
                        (academyQuery.data?.courses.length ?? 0) + 1
                      }
                      required
                      {...newCourseForm.register('courseIdx')}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title">Kurstitel</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="z.B. Komplexe Systeme einfach gemacht"
                      required
                      {...newCourseForm.register('title')}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subtitle">Untertitel</Label>
                    <Input
                      id="subtitle"
                      type="text"
                      placeholder="z.B. Von der Statistischen Physik zu den Sozialwissenschaften"
                      required
                      {...newCourseForm.register('subtitle')}
                    />
                  </div>

                  <Button
                    disabled={newCourseForm.formState.isSubmitting}
                    type="submit"
                    className="w-full"
                    size="lg"
                  >
                    Erstellen
                    {newCourseForm.formState.isSubmitting && (
                      <Spinner data-icon="inline-start" />
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </ul>
        </section>
      </div>
    </div>
  );
};

const Row = ({
  icon,
  actions,
  label,
  value,
  subtitle,
  className
}: {
  icon?: IconSvgElement;
  actions?: React.ReactNode;
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
      {actions}
    </li>
  );
};
