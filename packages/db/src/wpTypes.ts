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
