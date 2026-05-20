import withMDX from '@next/mdx/plugin';

const mdx = withMDX({ extension: /.mdx?$/ });

const nextConfig = {
  experimental: {
    appDir: true,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

export default mdx(nextConfig);
