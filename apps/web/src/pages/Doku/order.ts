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

export type DokuTocRootEntry = DokuTocBaseEntry & {
  isExtension: boolean;
  children: DokuTocBaseEntry[];
};

export type DokuTocBaseEntry = {
  name: string;

  /**
   * 0 based page index
   */
  pageIndex: number;
};

export const increasePageIndex = <
  T extends DokuTocBaseEntry | DokuTocRootEntry
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

  const MAX_ENTRIES_PER_PAGE = 30;

  const countCurrentEntries = () =>
    currentTocPageEntries.reduce(
      (acc, entry) => acc + 2 + entry.children.length,
      0
    );

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
    let children: DokuTocBaseEntry[] = [];

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
        children = object.headings.map((heading) => ({
          name: heading.text,
          pageIndex: absoluteObjectStartingPageIndex + heading.pageOffset
        }));
        break;
      }
      case 'KUA': {
        name = 'Kursübergreifende Aktivitäten';
        children = object.headings.map((heading) => ({
          name: heading.text,
          pageIndex: absoluteObjectStartingPageIndex + heading.pageOffset
        }));
        break;
      }
    }

    let newRootEntry: DokuTocRootEntry = {
      isExtension: false,
      name,
      pageIndex: absoluteObjectStartingPageIndex,
      children: []
    };
    currentTocPageEntries.push(newRootEntry);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      newRootEntry.children.push(child);

      // check for overflow
      if (countCurrentEntries() + 1 < MAX_ENTRIES_PER_PAGE) continue;

      // we have overflow, so do a page break
      addTocPage();

      // if we still have child entries left,
      // we have to break them onto an "extension" element
      if (i < children.length) {
        newRootEntry = {
          ...newRootEntry,
          children: [],
          isExtension: true
        };
        currentTocPageEntries.push(newRootEntry);
      }
    }

    // // handle overflow
    // if (countCurrentEntries() >= MAX_ENTRIES_PER_PAGE) {
    //   addTocPage();
    // }
  }

  addTocPage();

  return [...tocPages, ...order.pages];
};
