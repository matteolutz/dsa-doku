import { Academy, AcademyMeta, WpPost, WpUser } from '@repo/db/types';

export type JournalConfig = NonNullable<AcademyMeta['akaJournal']>;

/**
 * Joins a base URL and a path, ensuring the path is prefixed with a slash and the base URL does not end with a slash.
 */
const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const journalRequest = async (journalConfig: JournalConfig, route: string) => {
  const headers: Record<string, string> = {};
  if (typeof journalConfig.apiAuthentication !== 'undefined') {
    headers['Authorization'] =
      `Basic ${Buffer.from(`${journalConfig.apiAuthentication.username}:${journalConfig.apiAuthentication.applicationPassword}`).toString('base64')}`;
  }

  return fetch(joinUrl(journalConfig.apiEndpoint, route), {
    headers
  }).then((res) => res.json());
};

export const getJournalPosts = async (
  journalConfig: JournalConfig
): Promise<WpPost[]> => journalRequest(journalConfig, 'wp/v2/posts');

export const getJournalPost = async (
  journalConfig: JournalConfig,
  postId: number
): Promise<WpPost> => journalRequest(journalConfig, `wp/v2/posts/${postId}`);

export const getJournalUsers = async (
  journalConfig: JournalConfig
): Promise<WpUser[]> => journalRequest(journalConfig, 'wp/v2/users');
