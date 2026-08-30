import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'ja-JP',
  title: 'kyoz.ai',
  description: 'Web教材を作成し、授業で利用するためのホスティング環境',
  head: [['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]],
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'CLIで開発する', link: '/cli/' },
      { text: 'MCPで開発する', link: '/mcp/' },
      {
        text: 'Reference',
        items: [
          { text: 'kyozai.json', link: '/reference/kyozai-json' },
          { text: 'JupyterLite builder', link: '/reference/jupyterlite-builder' },
          { text: 'Platform API', link: '/reference/platform-api' },
        ],
      },
    ],
    sidebar: {
      '/cli/': [{ text: 'CLIで開発する', link: '/cli/' }],
      '/mcp/': [{ text: 'MCPで開発する', link: '/mcp/' }],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'kyozai.json', link: '/reference/kyozai-json' },
            { text: 'JupyterLite builder', link: '/reference/jupyterlite-builder' },
            { text: 'Platform API', link: '/reference/platform-api' },
          ],
        },
      ],
    },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kyoz-ai' },
    ],
  },
});
