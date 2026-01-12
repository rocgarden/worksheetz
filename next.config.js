const nextConfig = {
  serverExternalPackages: ["pdfkit", "jsdom", "pdfjs-dist"], // ← Add canvas and jsdom

  reactStrictMode: true,
  // Disable ESLint during build (fix those warnings later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline'
    https://va.vercel-scripts.com
    https://js.stripe.com
    https://checkout.stripe.com
    https://*.supabase.co
    https://www.googletagmanager.com
    https://www.google-analytics.com;
  connect-src 'self'
    https://va.vercel-scripts.com
    https://api.stripe.com
    https://*.supabase.co
    https://api.openai.com
    https://www.google-analytics.com
    https://analytics.google.com
    https://region1.google-analytics.com
    https://stats.g.doubleclick.net;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: blob: https:;
  frame-src https://js.stripe.com https://checkout.stripe.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Extra cache prevention for protected routes (belt + suspenders)
      // {
      //   source: "/(dashboard|generate|Worksheet-Editor)(.*)",
      //   headers: [
      //     {
      //       key: "Cache-Control",
      //       value: "no-store, no-cache, must-revalidate, private, max-age=0",
      //     },
      //     {
      //       key: "Pragma",
      //       value: "no-cache",
      //     },
      //     {
      //       key: "Expires",
      //       value: "0",
      //     },
      //   ],
      // },
    ];
  },
  webpack: (config, { webpack, isServer }) => {
    // Suppress specific warnings from Supabase realtime-js and Edge Runtime compatibility
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /A Node\.js API is used \(process\.versions/,
      },
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /A Node\.js API is used \(process\.version/,
      },
      {
        module: /node_modules\/@supabase\/supabase-js/,
        message: /A Node\.js API is used \(process\.version/,
      },
      // // ✅ Ignore canvas/sharp dylib conflicts
      // {
      //   module: /node_modules\/canvas/,
      //   message: /Class GNotificationCenterDelegate is implemented in both/,
      // },
    ];
    // ✅ CRITICAL: Tell webpack to ignore canvas/jsdom on client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // canvas: false,
        // jsdom: false,
        fs: false,
        "pdfjs-dist": false, // ← Add this
      };
    }

    // if (isServer) {
    //   // Prevent Next from externalizing jsdom/canvas
    //   config.externals = config.externals.map((external) => {
    //     if (typeof external !== "function") return external;
    //     return (ctx, callback) => {
    //       if (ctx.request === "jsdom" || ctx.request === "canvas") {
    //         return callback();
    //       }
    //       return external(ctx, callback);
    //     };
    //   });
    // }
    // ✅ Also externalize these for client bundles
    config.externals = config.externals || [];
    config.externals.push({
      // canvas: "canvas",
      jsdom: "jsdom",
      "pdfjs-dist": "pdfjs-dist",
    });
    // ✅ Fix module resolution order to prevent initialization errors
    config.optimization = {
      ...config.optimization,
      providedExports: true,
      usedExports: true,
      sideEffects: true,
    };
    return config;
  },
};

module.exports = nextConfig;
