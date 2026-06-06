import type { WpBlock } from '@repo/db/types';
import sanitize from 'sanitize-html';
import { trpcClient } from './trpc';

export const sanitizeJournalBlock = (outerHTML: string) =>
  sanitize(outerHTML, {
    allowedTags: sanitize.defaults.allowedTags.concat(['img']),
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

  const pageHeightLimit = 250;

  let currentPage = [];
  const pages = [];

  const getParentHeightInMm = () => {
    const boundingRect = parent.getBoundingClientRect();
    // we now that the width is 210mm
    return (boundingRect.height / boundingRect.width) * 210;
  };

  for (const block of blocks) {
    parent.innerHTML += block.outerHTML;
    const newBlock = parent.children[parent.children.length - 1] as HTMLElement;

    // fix pixel sizes to use cqw units
    const styledElements = newBlock.querySelectorAll('[style]');
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
    if (block.type === 'image') {
      const img = newBlock.querySelector('img');
      if (img) {
        await new Promise((resolve) => (img.onload = resolve));
      }
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

  const blockClassNameRegex = /wp-block-([a-z-]+)/;
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5'];

  const postBlocks = Array.from(postDoc.body.children)
    .map((child) => {
      const className = child.className;
      const match = className.match(blockClassNameRegex);
      if (match === null) return null;

      const cleanHtml = sanitizeJournalBlock(child.outerHTML);

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
