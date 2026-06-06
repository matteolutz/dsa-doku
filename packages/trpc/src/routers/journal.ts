import { WpPost } from '@repo/db/types';
import { router, t } from '..';

export const journalRouter = router({
  getPosts: t.procedure.query(async () => {
    const posts: WpPost[] = await fetch(
      'http://localhost:8080/?rest_route=/wp/v2/posts'
    ).then((res) => res.json());

    return posts;
  })
});
