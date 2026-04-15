import z from 'zod';
import { StaticAssert } from '../utils/types';
import { DocumentType } from '@repo/db/types';

export const DocumentTypeZod = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('COURSE'),
    courseId: z.int(),
    academyId: z.int()
  }),
  z.object({ type: z.literal('KUA'), academyId: z.int() }),
  z.object({ type: z.literal('AL_PREFACE'), academyId: z.int() }),
  z.object({ type: z.literal('KUMU'), academyId: z.int() })
]);
type _ = StaticAssert<
  z.infer<typeof DocumentTypeZod> extends DocumentType ? true : false
>;
