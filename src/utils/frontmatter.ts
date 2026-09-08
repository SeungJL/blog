import { toString } from 'mdast-util-to-string';
import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';

// 이 블로그는 한국어로 쓴다. reading-time 패키지는 공백으로 단어를 나누고
// 영어 분당 200단어를 기준으로 삼아, 한국어 글에서는 실제보다 두 배 가까이
// 길게 나왔다(1,557자 글이 6분). 한글과 영문을 따로 세서 합산한다.
const KOREAN_CHARS_PER_MINUTE = 600;
const LATIN_WORDS_PER_MINUTE = 250;

// 한글 음절·자모, CJK 한자, 일본어 가나
const CJK_PATTERN = /[가-힯ᄀ-ᇿ㄰-㆏一-鿿぀-ヿ]/g;

export const getReadingTimeInMinutes = (text: string): number => {
  const cjkCount = (text.match(CJK_PATTERN) || []).length;
  // CJK를 걷어낸 나머지에서 영문·숫자 단어를 센다 (코드 블록·URL 등)
  const latinCount = text.replace(CJK_PATTERN, ' ').split(/\s+/).filter(Boolean).length;

  const minutes = cjkCount / KOREAN_CHARS_PER_MINUTE + latinCount / LATIN_WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
};

export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTimeInMinutes(textOnPage);

    if (typeof file?.data?.astro?.frontmatter !== 'undefined') {
      file.data.astro.frontmatter.readingTime = readingTime;
    }
  };
};

export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      if (child.type === 'element' && child.tagName === 'table') {
        tree.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            style: 'overflow:auto',
          },
          children: [child],
        };

        i++;
      }
    }
  };
};
