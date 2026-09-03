import { AcademyMeta, WpPost } from '@repo/db/types';
import { router, t } from '..';
import z from 'zod';
import { requireUser } from '../utils/auth';
import { ensureAccessToAcademy } from '../utils/academy';
import { fmError } from '../error';
import {
  getJournalCategories,
  getJournalPost,
  getAllJournalPosts,
  getJournalUsers
} from '../utils/journal';

export const journalRouter = router({
  getPostsWithUserNames: t.procedure
    .input(
      z.object({
        academyId: z.int()
      })
    )
    .query(async ({ input, ctx }) => {
      const user = requireUser(ctx);
      await ensureAccessToAcademy(user, input.academyId, 'read');

      // find the academy
      const academy = await ctx.prisma.academy.findUnique({
        where: { id: input.academyId }
      });
      if (!academy)
        throw fmError({
          type: 'resource-not-found',
          resource: 'academy',
          id: input.academyId
        }).toTRPCError();

      // check if the academy has the aka journal feature enabled
      const meta = academy.meta as AcademyMeta;
      if (typeof meta.akaJournal === 'undefined')
        throw fmError({
          type: 'academy-feature-not-enabled',
          feature: 'aka-journal'
        }).toTRPCError();

      const posts = await getAllJournalPosts(meta.akaJournal, {
        publishedOnly: true
      });
      if (posts.length === 0) return [];

      const categories = await getJournalCategories(meta.akaJournal);

      return posts.map((post) => ({
        ...post,
        authors: post.authors?.map(({ display_name }) => display_name) ?? [],
        categories: post.categories.map((categoryId) => ({
          id: categoryId,
          name: categories.find((cat) => cat.id === categoryId)?.name
        }))
      }));
    }),
  getPost: t.procedure
    .input(
      z.object({
        academyId: z.int(),
        wpPostId: z.int()
      })
    )
    .query(async ({ ctx, input }) => {
      const user = requireUser(ctx);
      await ensureAccessToAcademy(user, input.academyId, 'read');

      // find the academy
      const academy = await ctx.prisma.academy.findUnique({
        where: { id: input.academyId }
      });
      if (!academy)
        throw fmError({
          type: 'resource-not-found',
          resource: 'academy',
          id: input.academyId
        }).toTRPCError();

      // check if the academy has the aka journal feature enabled
      const meta = academy.meta as AcademyMeta;
      if (typeof meta.akaJournal === 'undefined')
        throw fmError({
          type: 'academy-feature-not-enabled',
          feature: 'aka-journal'
        }).toTRPCError();

      const post = await getJournalPost(meta.akaJournal, input.wpPostId);
      return { post, wpBaseUrl: meta.akaJournal.baseEndpoint };
    })
});
