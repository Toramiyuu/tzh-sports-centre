import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/dashboard', '/profile'],
    },
    sitemap: 'https://tzh-sports-centre.vercel.app/sitemap.xml',
  }
}
