import { TypographyH2, TypographyH4 } from '@/components/fm/typography';
import { Card } from '@/components/ui/card';
import { trpc, useSelectedAcademy } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import AbstractDocuments from './documents';

const SectionsPage = () => {
  const academyId = useSelectedAcademy();

  const academyQuery = useQuery(
    trpc.academy.getWithCourses.queryOptions({
      academyId
    })
  );

  console.log(academyQuery.data);

  return (
    <div className="size-full p-4 flex justify-center">
      <div className="w-200 max-w-200 flex flex-col gap-4">
        <TypographyH2>Abschnitte</TypographyH2>

        <Card className="w-full p-4">
          <TypographyH4>Vorwort der Akademieleitung</TypographyH4>
        </Card>

        <Card className="w-full p-4">
          <TypographyH4>KüMu</TypographyH4>
        </Card>

        {academyQuery.data?.courses.map((course) => (
          <Card key={`course-${course.id}`} className="w-full p-4">
            <TypographyH4>
              {academyQuery.data?.yearIdx}.{course.courseIdx} {course.title}
            </TypographyH4>
            <AbstractDocuments
              documentType={{ type: 'course', courseId: course.id }}
            />
          </Card>
        ))}

        <Card className="w-full p-4">
          <TypographyH4>KüA</TypographyH4>
          <AbstractDocuments documentType={{ type: 'kua', academyId }} />
        </Card>
      </div>
    </div>
  );
};

export default SectionsPage;
