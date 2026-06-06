import { AcademyMeta, WpPost } from '@repo/db/types';
import { router, t } from '..';
import z from 'zod';
import { requireUser } from '../utils/auth';
import { ensureAccessToAcademy } from '../utils/academy';
import { fmError } from '../error';
import {
  getJournalPost,
  getJournalPosts,
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
      if (typeof meta.akaJournalApiEndpoint === 'undefined')
        throw fmError({
          type: 'academy-feature-not-enabled',
          feature: 'aka-journal'
        }).toTRPCError();

      const posts = await getJournalPosts(meta.akaJournalApiEndpoint);
      if (posts.length === 0) return [];

      const users = await getJournalUsers(meta.akaJournalApiEndpoint);

      return posts.map((post) => ({
        ...post,
        authorName: users.find((user) => user.id === post.author)?.name
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
      if (typeof meta.akaJournalApiEndpoint === 'undefined')
        throw fmError({
          type: 'academy-feature-not-enabled',
          feature: 'aka-journal'
        }).toTRPCError();

      const post = await getJournalPost(
        meta.akaJournalApiEndpoint,
        input.wpPostId
      );
      return post;
    })
});
