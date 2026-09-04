import { TypographyH2, TypographyH4 } from '@/components/fm/typography';
import { Card } from '@/components/ui/card';
import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import AbstractDocuments from './documents';
import { useSearchParam } from 'react-use';

const SectionsPage = () => {
  const debug = !!useSearchParam('debug');
  console.log('[SectionsPage] Debug:', debug);

  const academyId = useSelectedAcademy();

  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({
      academyId
    })
  );

  console.log(academyQuery.data);

  return (
    <div className="w-full p-4 flex justify-center">
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col">
          <TypographyH2>Beiträge</TypographyH2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte die Reihenfolge und Dateien jedes Abschnitts.
          </p>
        </div>

        <Card className="w-full p-4 gap-3">
          <TypographyH4>Vorwort der Akademieleitung</TypographyH4>
          <AbstractDocuments
            debug={debug}
            documentType={{ type: 'AL_PREFACE', academyId }}
          />
        </Card>

        <Card className="w-full p-4 gap-3">
          <TypographyH4>KüMu</TypographyH4>
          <AbstractDocuments
            debug={debug}
            documentType={{ type: 'KUMU', academyId }}
          />
        </Card>

        {academyQuery.data?.courses.map((course) => (
          <Card key={`course-${course.id}`} className="w-full p-4 gap-3">
            <TypographyH4>
              <span className="text-muted-foreground tracking-tight mr-2">
                {academyQuery.data?.yearIdx}.{course.courseIdx}
              </span>
              {course.title}
            </TypographyH4>
            <AbstractDocuments
              debug={debug}
              documentType={{ type: 'COURSE', courseId: course.id, academyId }}
            />
          </Card>
        ))}

        <Card className="w-full p-4 gap-3">
          <TypographyH4>KüA</TypographyH4>
          <AbstractDocuments
            debug={debug}
            documentType={{ type: 'KUA', academyId }}
          />
        </Card>
      </div>
    </div>
  );
};

export default SectionsPage;
