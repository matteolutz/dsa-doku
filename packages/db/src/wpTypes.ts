import z from 'zod';

export type WpPostStatus =
  | 'publish'
  | 'future'
  | 'draft'
  | 'pending'
  | 'private';

export type WpCommentStatus = 'open' | 'closed';

export type WpPostFormat =
  | 'standard'
  | 'aside'
  | 'chat'
  | 'gallery'
  | 'link'
  | 'image'
  | 'quote'
  | 'status'
  | 'video'
  | 'audio';

export interface WpRenderedField {
  rendered: string;
}

export interface WpContent {
  rendered: string;
  protected?: boolean;
  block_version?: number;
}

export interface WpExcerpt {
  rendered: string;
  protected?: boolean;
}

export interface WpPost {
  /** Unique identifier */
  id: number;

  /** Publication dates */
  date: string | null;
  date_gmt: string | null;

  /** Last modified dates */
  modified: string;
  modified_gmt: string;

  /** URL fields */
  link: string;
  slug: string;

  /** Post metadata */
  status: WpPostStatus;
  type: string;
  password?: string;

  /** Edit-context fields */
  permalink_template?: string;
  generated_slug?: string;

  /** Content */
  guid: WpRenderedField;
  title: WpRenderedField;
  content: WpContent;
  excerpt: WpExcerpt;

  /** Relationships */
  author: number;
  featured_media: number;

  /** Discussion */
  comment_status: WpCommentStatus;
  ping_status: WpCommentStatus;

  /** Presentation */
  format: WpPostFormat;
  sticky: boolean;
  template: string;

  /** Taxonomies */
  categories: number[];
  tags: number[];

  /** Custom fields */
  meta: Record<string, unknown>;
}

export interface WpAvatarUrls {
  '24'?: string;
  '48'?: string;
  '96'?: string;

  /** Allow custom avatar sizes */
  [size: string]: string | undefined;
}

export interface WpUser {
  /** Unique identifier */
  id: number;

  /** Login name (edit context only) */
  username?: string;

  /** Display information */
  name: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  slug: string;

  /** Contact information */
  email?: string;
  url: string;

  /** Profile */
  description: string;
  locale?: '' | 'en_US';

  /** Public URLs */
  link: string;

  /** Registration date (edit context only) */
  registered_date?: string;

  /** Roles (edit context only) */
  roles?: string[];

  /**
   * Password is accepted when creating/updating a user,
   * but is never returned by the API.
   */
  password?: string;

  /** Capabilities (edit context only) */
  capabilities?: Record<string, boolean>;

  /** Extra capabilities (edit context only) */
  extra_capabilities?: Record<string, boolean>;

  /** Avatar URLs keyed by size */
  avatar_urls: WpAvatarUrls;

  /** Custom user meta */
  meta: Record<string, unknown>;
}

export const WpBlockSchema = z.object({
  /**
   * The block type (e.g. image, table, paragraph)
   * This is inferred from the block's class
   */
  type: z.string(),

  /**
   * The blocks outer HTML (including the block container itself)
   */
  outerHTML: z.string(),

  /**
   * Heading metadata if the block is a heading
   */
  heading: z
    .object({
      text: z.string(),
      level: z.number()
    })
    .optional(),

  /**
   * Media metadata if the block is a media block (i.e. audio, video, ...)
   */
  media: z
    .object({
      type: z.enum(['audio', 'video']),
      src: z.string()
    })
    .optional()
});
export type WpBlock = z.infer<typeof WpBlockSchema>;
