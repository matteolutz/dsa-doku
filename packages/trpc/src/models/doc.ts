import z from 'zod';
import { StaticAssert } from '../utils/types';
import { DocumentType } from '@repo/db/types';

export const DocumentTypeZod = z.discriminatedUnion('type', [
  z.object({ type: z.literal('course'), courseId: z.int() }),
  z.object({ type: z.literal('kua'), academyId: z.int() })
]);
type _ = StaticAssert<
  z.infer<typeof DocumentTypeZod> extends DocumentType ? true : false
>;
