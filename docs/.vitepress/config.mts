import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ng-ability',
  description: 'Access control lists for Angular',
  lang: 'en-US',
  base: '/ng-ability/',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/ng-ability/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'ng-ability' },

    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      {
        text: 'v2.2.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/topaxi/ng-ability/blob/main/CHANGELOG.md',
          },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/ng-ability',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is ng-ability?', link: '/guide/' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Defining Abilities', link: '/guide/abilities' },
            { text: 'Template Usage', link: '/guide/templates' },
            { text: 'Programmatic Usage', link: '/guide/service' },
            { text: 'Type Safety', link: '/guide/type-safety' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Global Abilities', link: '/guide/global-abilities' },
            { text: 'Route Guards', link: '/guide/route-guards' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Recipes', link: '/guide/recipes' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/topaxi/ng-ability' },
    ],

    editLink: {
      pattern: 'https://github.com/topaxi/ng-ability/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright &copy; 2024-present',
    },
  },
})
