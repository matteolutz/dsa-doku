import { AcademyMeta, WpCategory, WpPost, WpUser } from '@repo/db/types';
import makeFetchCookie from 'fetch-cookie';

export type JournalConfig = NonNullable<AcademyMeta['akaJournal']>;

const fetchCookie = makeFetchCookie(fetch);

/**
 * Joins a base URL and a path, ensuring the path is prefixed with a slash and the base URL does not end with a slash.
 */
const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const journalRequest = async (journalConfig: JournalConfig, route: string) => {
  console.log('doing wp request', route);

  const headers: Record<string, string> = {};
  if (typeof journalConfig.apiAuthentication !== 'undefined') {
    switch (journalConfig.apiAuthentication.type) {
      case 'applicationPassword':
        headers['Authorization'] =
          `Basic ${Buffer.from(`${journalConfig.apiAuthentication.username}:${journalConfig.apiAuthentication.applicationPassword}`).toString('base64')}`;
        break;
      case 'cookie':
        // don't do any authentication by default. only do the wp-login.php request if the
        // actual request fails with a 403 code

        break;
    }
  }

  let res = await fetchCookie(joinUrl(journalConfig.apiEndpoint, route), {
    headers,
    credentials: 'include'
  });

  if (
    journalConfig.apiAuthentication?.type === 'cookie' &&
    res.status === 403
  ) {
    console.log('retrying wp with authentication');
    // the actual request failed with a 403 code. retry with authentication
    await fetchCookie(journalConfig.apiAuthentication.wpLoginEndpoint, {
      method: 'POST',
      credentials: 'include',
      body: new URLSearchParams({
        log: journalConfig.apiAuthentication.username,
        pwd: journalConfig.apiAuthentication.password
      })
    });

    // retry the request
    res = await fetchCookie(joinUrl(journalConfig.apiEndpoint, route), {
      headers,
      credentials: 'include'
    });
  }

  return res.json();
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

export const getJournalCategories = async (
  journalConfig: JournalConfig
): Promise<WpCategory[]> => journalRequest(journalConfig, 'wp/v2/categories');
