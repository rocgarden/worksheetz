// next-sitemap.config.js
// next-sitemap.config.js
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.worksheetzai.com",
  generateRobotsTxt: true,
  exclude: [
    "/twitter-image.*",
    "/opengraph-image.*",
    "/icon.*",
    "/dashboard",
    "/dashboard/*",
  ],
  additionalPaths: async (config) => {
    const subjects = [
      'reading-comprehension',
      'grammar',
      'social-studies',
      'staar-reading'
    ];
    const grades = [
      'grade-k',
      'grade-1',
      'grade-2',
      'grade-3',
      'grade-4',
      'grade-5',
      'grade-6',
      'grade-7',
      'grade-8'
    ];

    const paths = [];
    for (const subject of subjects) {
      for (const grade of grades) {
        paths.push({
          loc: `/worksheets/${subject}/${grade}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      }
    }
    return paths;
  },
};