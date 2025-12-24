// @ts-check
const {themes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ElecSus Documentation',
  tagline: 'Elemental Susceptibility - Atomic Physics Simulation Library',
  favicon: 'img/favicon.ico',

  url: 'https://elecsus.onrender.com',
  baseUrl: '/',

  organizationName: 'OutisNemosseus',
  projectName: 'ElecSus',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'ElecSus',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'libsSidebar',
            position: 'left',
            label: 'Library Reference',
          },
          {
            href: 'https://github.com/OutisNemosseus/ElecSus',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Library Reference',
                to: '/libs',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/OutisNemosseus/ElecSus',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ElecSus. Built with Docusaurus.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['python', 'matlab', 'latex', 'bash'],
      },
    }),
};

module.exports = config;
