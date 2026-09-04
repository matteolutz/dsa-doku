import type { WpBlock } from '@repo/db/types';
import sanitize from 'sanitize-html';
import { trpcClient } from './trpc';
import { JOURNAL_AUDIO_PLAYER_CQW_HEIGHT } from '@/pages/Doku/wp/audio';
import { htmlToPlainText } from './html';

const MATH_ML_TAGS = [
  'annotation-xml',
  'annotation',
  'maction',
  'math',
  'menclose',
  'merror',
  'mfenced',
  'mfrac',
  'mi',
  'mmultiscripts',
  'mn',
  'mo',
  'mover',
  'mpadded',
  'mphantom',
  'mprescripts',
  'mroot',
  'mrow',
  'ms',
  'mspace',
  'msqrt',
  'mstyle',
  'msub',
  'msubsup',
  'msup',
  'mtable',
  'mtd',
  'mtext',
  'mtr',
  'munder',
  'munderover',
  'semantics'
];

export const sanitizeJournalBlock = (outerHTML: string) =>
  sanitize(outerHTML, {
    allowedTags: sanitize.defaults.allowedTags.concat([
      'img',
      'audio',
      'video',
      'details',
      'summary',
      'svg',
      'path',
      ...MATH_ML_TAGS
    ]),
    allowedAttributes: false,
    transformTags: {
      '*': (tagName, attribs) => {
        const clazz: string | undefined = attribs['class'];
        if (typeof clazz === 'undefined') return { tagName, attribs };

        const classList = clazz.split(' ').map((c) => `journal-${c}`);
        return {
          tagName,
          attribs: { ...attribs, class: classList.join(' ') }
        };
      }
    },
    allowedClasses: {
      '*': ['journal-*']
    },
    parseStyleAttributes: false
  });

export const paginateJournalBlocks = async (
  blocks: WpBlock[],
  options: {
    pixelScaling: number;
  }
) => {
  const container = document.createElement('div');
  container.style.containerType = 'inline-size';
  container.style.width = '210mm';
  container.style.visibility = 'hidden';
  container.style.position = 'absolute';
  document.body.appendChild(container);

  const page = document.createElement('div');
  page.className = 'journal-wp-page';
  page.style.width = '100%';
  container.appendChild(page);

  const pageHeightLimit = 200;

  let currentPage = [];
  const pages = [];

  const getContainerHeightInMm = () => {
    const boundingRect = container.getBoundingClientRect();
    // we know that the width is 210mm
    return (boundingRect.height / boundingRect.width) * 210;
  };

  /**
   * certain block types need special handling.
   * first of all, media content needs to be awaited
   */
  const prepareNewBlock = async (
    blockMeta: WpBlock,
    blockElement: HTMLElement
  ) => {
    switch (blockMeta.type) {
      case 'image': {
        const img = blockElement.querySelector('img');
        if (img) {
          await new Promise((resolve) => (img.onload = resolve));
        }
        break;
      }
      case 'details': {
        // we need to make sure to render the details content openend to take its
        // height into account
        const details = blockElement as HTMLDetailsElement;
        details.open = true;
        break;
      }
      case 'audio': {
        const audio = blockElement.querySelector('audio');
        if (!audio) break;

        blockMeta.media = {
          type: 'audio',
          src: audio.getAttribute('src') ?? '',
          caption: blockElement.querySelector('.journal-wp-element-caption')
            ?.textContent
        };
        // we need to take into account, that the audio player will be rendered by react
        // and has a fixed height
        blockElement.style.height = `${JOURNAL_AUDIO_PLAYER_CQW_HEIGHT}cqw`;
        break;
      }
      case 'video': {
        const video = blockElement.querySelector('video');
        if (!video) break;

        blockMeta.media = {
          type: 'video',
          src: video.getAttribute('src') ?? '',
          caption: blockElement.querySelector('.journal-wp-element-caption')
            ?.textContent
        };
        break;
      }
      default:
        break;
    }
  };

  for (const block of blocks) {
    if (block.type === 'pagebreak') {
      pages.push(currentPage);
      currentPage = [];
      continue;
    }

    page.innerHTML += block.outerHTML;
    const newBlock = page.children[page.children.length - 1] as HTMLElement;

    // fix pixel sizes to use cqw units
    const styledElements = [newBlock, ...newBlock.querySelectorAll('[style]')];
    for (const styledElement of styledElements) {
      const style = styledElement.getAttribute('style');
      if (!style) continue;

      const converted = style.replace(/(-?\d*\.?\d+)px\b/g, (_, value) => {
        const num = parseFloat(value);
        const convertedValue = num * options.pixelScaling;
        return `${convertedValue}cqw`;
      });

      styledElement.setAttribute('style', converted);
    }

    await prepareNewBlock(block, newBlock);

    // with this new block we overflowed
    if (getContainerHeightInMm() > pageHeightLimit) {
      if (currentPage.length === 0) {
        throw new Error('a single block exceeds the page height limit');
      }

      // remove the block that overflowed from the page
      page.removeChild(newBlock);

      pages.push(currentPage);
      currentPage = [];
      page.innerHTML = '';

      // append the block to the next page
      page.innerHTML += newBlock.outerHTML;
    }

    block.outerHTML = newBlock.outerHTML;
    currentPage.push(block);
  }

  if (currentPage.length > 0) {
    console.log('contents of last page:', currentPage);
    pages.push(currentPage);
  }

  document.body.removeChild(container);

  return pages;
};

export const fetchJournalPostBlocks = async (
  postId: number,
  academyId: number,
  options?: {
    insertDocumentTitle?: boolean;
    insertAuthors?: boolean;
    collectHeadings?: boolean;
  }
) => {
  const { post, wpBaseUrl } = await trpcClient.journal.getPost.query({
    wpPostId: postId,
    academyId
  });

  console.log('post', post);

  const parser = new DOMParser();
  const postDoc = parser.parseFromString(post.content.rendered, 'text/html');

  console.log('post doc', postDoc);

  const blockClassNameRegex = /wp-block-([a-z-]+)/;
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5'];

  const postBlocks = Array.from(postDoc.body.childNodes)
    .map((child) => {
      if (child.nodeType === 8) {
        switch (child.textContent) {
          case 'nextpage':
            return { type: 'pagebreak', outerHTML: '' };
          default:
            return null;
        }
      } else if (!(child instanceof HTMLElement)) return null;

      const className = child.className;
      const match = className.match(blockClassNameRegex);
      if (match === null) return null;

      const cleanHtml = sanitizeJournalBlock(child.outerHTML);
      console.log('dirty', child.outerHTML, 'sanitized', cleanHtml);

      let heading = undefined;

      if (options?.collectHeadings) {
        const headingIdx = headings.indexOf(child.tagName.toLocaleLowerCase());
        if (headingIdx !== -1) {
          heading = {
            text: child.textContent ?? '',
            level: headingIdx + 1
          };
        }
      }

      return {
        type: match[1],
        outerHTML: cleanHtml,
        heading
      };
    })
    .filter((block) => block !== null);

  if (options?.insertAuthors && Array.isArray(post.authors)) {
    const authorsDiv = document.createElement('div');
    authorsDiv.className = 'journal-wp-custom-block-authors';

    for (const author of post.authors) {
      const authorTag = document.createElement('a');
      authorTag.href = `${wpBaseUrl}/author/${author.slug}`;
      authorTag.target = '_blank';
      authorTag.rel = 'author';
      authorTag.title = author.display_name;
      authorTag.textContent = author.display_name;
      authorsDiv.appendChild(authorTag);
    }

    postBlocks.unshift({
      type: 'custom',
      outerHTML: authorsDiv.outerHTML,
      heading: undefined
    });
  }

  if (options?.insertDocumentTitle) {
    const title = post.title.rendered;
    const titleBlock = {
      type: 'heading',
      outerHTML: `<h1 class="journal-wp-block-heading">${title}</h1>`,
      heading: { text: htmlToPlainText(title), level: 1 }
    };
    postBlocks.unshift(titleBlock);
  }

  console.log('postBlocks', postBlocks);

  const pages = await paginateJournalBlocks(postBlocks, {
    pixelScaling: 0.2
  });

  return { pages, post };
};
