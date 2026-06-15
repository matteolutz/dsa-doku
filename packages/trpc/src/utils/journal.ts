import { AcademyMeta, WpPost, WpUser } from '@repo/db/types';
import makeFetchCookie from 'fetch-cookie';

export type JournalConfig = NonNullable<AcademyMeta['akaJournal']>;

const fetchCookie = makeFetchCookie(fetch);

/**
 * Joins a base URL and a path, ensuring the path is prefixed with a slash and the base URL does not end with a slash.
 */
const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const journalRequest = async (journalConfig: JournalConfig, route: string) => {
  const headers: Record<string, string> = {};
  if (typeof journalConfig.apiAuthentication !== 'undefined') {
    switch (journalConfig.apiAuthentication.type) {
      case 'applicationPassword':
        headers['Authorization'] =
          `Basic ${Buffer.from(`${journalConfig.apiAuthentication.username}:${journalConfig.apiAuthentication.applicationPassword}`).toString('base64')}`;
        break;
      case 'cookie':
        await fetchCookie(journalConfig.apiAuthentication.wpLoginEndpoint, {
          method: 'POST',
          credentials: 'include',
          body: new URLSearchParams({
            log: journalConfig.apiAuthentication.username,
            pwd: journalConfig.apiAuthentication.password
          })
        });

        break;
    }
  }

  return fetchCookie(joinUrl(journalConfig.apiEndpoint, route), {
    headers,
    credentials: 'include'
  })
    .then((res) => res.json())
    .then((res) => {
      if (process.env.NODE_ENV !== 'production')
        console.log('wp api response', res);
      return res;
    });
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
