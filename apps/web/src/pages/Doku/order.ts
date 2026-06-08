import type {
  AcademyWithCourses,
  Document,
  DocumentMeta,
  DocumentTypeWithoutAcademyId,
  WpBlock
} from '@repo/db/types';

export type DokuOrder = {
  pages: DokuOrderPage[];
  objects: DokuOrderObject[];
};

export type DokuOrderTocPage = {
  type: 'toc';
  entries: DokuTocRootEntry[];
};

export type DokuOrderPage =
  | {
      type: 'file-page';
      docId: string;
      pageIndex: number;
    }
  | {
      type: 'wp-page';
      wpBlocks: WpBlock[];
    }
  | {
      type: 'blank';
    }
  | {
      type: 'cover';
      academyId: number;
    }
  | DokuOrderTocPage;

export type DokuOrderObject = {
  type: DocumentTypeWithoutAcademyId;

  name: string;
  headings: { text: string; pageOffset: number }[];
  startingPageIndex: number;
};

/**
 * Make a document order based on the documents' metadata.
 * The documents should be provided in sorted order.
 */
export const makeDokuOrder = (
  documents: Document[],
  config: { breakToEvenPageOnNewCategory: boolean }
): DokuOrder => {
  const orderPages: DokuOrderPage[] = [];
  const orderObjects: DokuOrderObject[] = [];

  let currentCategoryPages = 0;
  let currentCategoryStartingPageIndex = 0;
  let currentCategoryHeadings: { text: string; pageOffset: number }[] = [];

  const addObject = (lastDocument: Document) => {
    orderObjects.push({
      type:
        lastDocument.category === 'COURSE'
          ? { type: 'COURSE', courseId: lastDocument.courseId! }
          : { type: lastDocument.category },
      name: lastDocument.title,
      headings: currentCategoryHeadings,
      startingPageIndex: currentCategoryStartingPageIndex
    });

    currentCategoryHeadings = [];
    currentCategoryStartingPageIndex = orderPages.length;
    currentCategoryPages = 0;
  };

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];

    const docMeta = document.meta as DocumentMeta;
    switch (docMeta.type) {
      case 'file':
        currentCategoryHeadings.push(
          ...docMeta.meta.headings.map((heading) => ({
            text: heading.text,
            pageOffset: currentCategoryPages + heading.pageOffset
          }))
        );

        for (
          let pageOffset = 0;
          pageOffset < docMeta.meta.pages.length;
          pageOffset++
        ) {
          orderPages.push({
            type: 'file-page',
            docId: document.id,
            pageIndex: pageOffset
          });
        }

        currentCategoryPages += docMeta.meta.pages.length;
        break;
      case 'wp':
        for (let i = 0; i < docMeta.meta.wpPostPaginatedBlocks.length; i++) {
          const page = docMeta.meta.wpPostPaginatedBlocks[i];
          orderPages.push({
            type: 'wp-page',
            wpBlocks: page
          });

          // find any h1's on this page
          for (const block of page) {
            if (typeof block.heading === 'undefined') continue;
            if (block.heading.level !== 1) continue;

            currentCategoryHeadings.push({
              text: block.heading.text,
              pageOffset: currentCategoryPages + i
            });
          }
        }

        currentCategoryPages += docMeta.meta.wpPostPaginatedBlocks.length;
        break;
    }

    // if we have a next document
    if (i < documents.length - 1) {
      const nextDocument = documents[i + 1];

      const isDifferentCategoryOrCourse =
        nextDocument.category !== document.category ||
        document.courseId !== nextDocument.courseId;

      if (isDifferentCategoryOrCourse) {
        addObject(document);
      }

      const isEvenPage = orderPages.length % 2 === 0;

      if (
        config.breakToEvenPageOnNewCategory &&
        isDifferentCategoryOrCourse &&
        !isEvenPage
      ) {
        orderPages.push({ type: 'blank' });
        currentCategoryStartingPageIndex++;
      }
    }
  }

  if (documents.length > 0) {
    // add the last document
    addObject(documents[documents.length - 1]);
  }

  return { pages: orderPages, objects: orderObjects };
};

export type DokuTocRootEntry = DokuTocChildEntry & {
  children: DokuTocChildEntry[];
};

export type DokuTocChildEntry = {
  name: string;

  /**
   * 0 based page index
   */
  pageIndex: number;
};

export const increasePageIndex = <
  T extends DokuTocChildEntry | DokuTocRootEntry
>(
  entry: T
): T => {
  if ('children' in entry) {
    return {
      ...entry,
      pageIndex: entry.pageIndex + 1,
      children: entry.children.map(increasePageIndex)
    };
  } else {
    return {
      ...entry,
      pageIndex: entry.pageIndex + 1
    };
  }
};

export const prependTableOfContents = (
  order: DokuOrder,
  academy: AcademyWithCourses,
  config: { tocStartingPageIndex: number }
): DokuOrderPage[] => {
  const tocPages: DokuOrderTocPage[] = [];
  let currentTocPageEntries: DokuTocRootEntry[] = [];

  const addTocPage = () => {
    tocPages.push({
      type: 'toc',
      entries: currentTocPageEntries
    });

    for (const page of tocPages) {
      page.entries = page.entries.map(increasePageIndex);
    }

    currentTocPageEntries = [];
  };

  for (const object of order.objects) {
    const absoluteObjectStartingPageIndex =
      config.tocStartingPageIndex + tocPages.length + object.startingPageIndex;

    let name: string;
    switch (object.type.type) {
      case 'AL_PREFACE':
      case 'KUMU': {
        name = object.name;
        break;
      }
      case 'COURSE': {
        const courseId = object.type.courseId;
        const course = academy.courses.find((c) => c.id === courseId)!;

        name = `Kurs ${academy.yearIdx}.${course.courseIdx}\t${course.title.toUpperCase()}`;
        break;
      }
      case 'KUA': {
        name = 'Kursübergreifende Aktivitäten';
        break;
      }
    }

    currentTocPageEntries.push({
      name,
      pageIndex: absoluteObjectStartingPageIndex,
      children: object.headings.map((heading) => ({
        name: heading.text,
        pageIndex: absoluteObjectStartingPageIndex + heading.pageOffset
      }))
    });

    // TODO: add logic, to handle page overflow
  }

  addTocPage();

  return [...tocPages, ...order.pages];
};
