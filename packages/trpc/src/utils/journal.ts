import { WpPost, WpUser } from '@repo/db/types';

/**
 * Joins a base URL and a path, ensuring the path is prefixed with a slash and the base URL does not end with a slash.
 */
const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const getJournalPosts = async (apiEndpoint: string): Promise<WpPost[]> =>
  fetch(joinUrl(apiEndpoint, 'wp/v2/posts')).then((res) => res.json());

export const getJournalPost = async (
  apiEndpoint: string,
  postId: number
): Promise<WpPost> =>
  fetch(joinUrl(apiEndpoint, `wp/v2/posts/${postId}`)).then((res) =>
    res.json()
  );

export const getJournalUsers = async (apiEndpoint: string): Promise<WpUser[]> =>
  fetch(joinUrl(apiEndpoint, 'wp/v2/users')).then((res) => res.json());

export const transformJournalPostContent = (post: WpPost) => {};
