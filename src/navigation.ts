import { getPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: '글',
      href: getPermalink('/'),
    },
    {
      text: '소개',
      href: getPermalink('/about'),
    },
  ],
  actions: [
    {
      text: 'About',
      href: 'https://study-about.club',
      target: '_blank',
    },
  ],
};

export const footerData = {
  links: [],
  secondaryLinks: [],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/SeungJL' },
    { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:j44s11@naver.com' },
  ],
  footNote: `
    이승주 · <a class="text-blue-600 underline dark:text-muted" href="https://study-about.club">About</a>
  `,
};
