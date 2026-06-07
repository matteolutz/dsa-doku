import type { WpBlock } from '@repo/db/types';
import sanitize from 'sanitize-html';
import { trpcClient } from './trpc';

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
      'details',
      'summary',
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
  const parent = document.createElement('div');
  parent.style.containerType = 'inline-size';
  parent.style.width = '210mm';
  parent.style.visibility = 'hidden';
  parent.style.position = 'absolute';
  document.body.appendChild(parent);

  const pageHeightLimit = 230;

  let currentPage = [];
  const pages = [];

  const getParentHeightInMm = () => {
    const boundingRect = parent.getBoundingClientRect();
    // we now that the width is 210mm
    return (boundingRect.height / boundingRect.width) * 210;
  };

  for (const block of blocks) {
    if (block.type === 'pagebreak') {
      pages.push(currentPage);
      currentPage = [];
      continue;
    }

    parent.innerHTML += block.outerHTML;
    const newBlock = parent.children[parent.children.length - 1] as HTMLElement;

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

    // certain block types need special handling.
    // first of all, media content needs to be awaited
    switch (block.type) {
      case 'image': {
        const img = newBlock.querySelector('img');
        if (img) {
          await new Promise((resolve) => (img.onload = resolve));
        }
        break;
      }
      case 'details': {
        // we need to make sure to render the details content openend to take its
        // height into account
        const details = newBlock as HTMLDetailsElement;
        details.open = true;
        break;
      }
      case 'audio': {
        const audio = newBlock.querySelector('audio');
        if (audio) {
          block.media = { type: 'audio', src: audio.getAttribute('src') ?? '' };
        }
        break;
      }
      case 'video': {
        const video = newBlock.querySelector('video');
        if (video) {
          block.media = { type: 'video', src: video.getAttribute('src') ?? '' };
        }
        break;
      }
      default:
        break;
    }

    // with this new block we overflowed
    if (getParentHeightInMm() > pageHeightLimit) {
      if (currentPage.length === 0) {
        throw new Error('a single block exceeds the page height limit');
      }

      pages.push(currentPage);
      currentPage = [];
      parent.innerHTML = '';
    }

    block.outerHTML = newBlock.outerHTML;
    currentPage.push(block);
  }

  pages.push(currentPage);

  document.body.removeChild(parent);

  return pages;
};

export const fetchJournalPostBlocks = async (
  postId: number,
  academyId: number
) => {
  const post = await trpcClient.journal.getPost.query({
    wpPostId: postId,
    academyId
  });

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
      const headingIdx = headings.indexOf(child.tagName.toLocaleLowerCase());
      if (headingIdx !== -1) {
        heading = {
          text: child.textContent ?? '',
          level: headingIdx + 1
        };
      }

      return {
        type: match[1],
        outerHTML: cleanHtml,
        heading
      };
    })
    .filter((block) => block !== null);

  console.log('postBlocks', postBlocks);

  const pages = await paginateJournalBlocks(postBlocks, {
    pixelScaling: 0.2
  });

  return { pages, post };
};
