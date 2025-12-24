const config = {
  // REQUIRED
  appName: "Worksheetz AI",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "An AI-powered tool that helps educators instantly generate customized worksheets by subject, grade level, and topic.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "worksheetzai.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          //  process.env.NODE_ENV === "development",
          "price_1Sct9QEZ6GaUMPgOyiDWQnym", //live id
        // "price_1Sg8J5INKxz4XaqKUsGnItXQ", //-- testing id
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Starter",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for teachers getting started with AI worksheets.",
        // The price you want to display, the one user will be charged on Stripe.
        price: 0 + "/mo",
        isFree: false,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        // priceAnchor: 0,
        monthlyGenerations: 2,
        monthlyPdfs: 1,
        features: [
          {
            name: "Access to advanced AI-powered UI models for smarter worksheet creation",
          },
          {
            name: "Generate quizzes tailored to specific subjects and grade levels",
          },
          { name: "Download up to 1 custom PDFs per month" },
          {
            name: "Regenerate worksheets up to 2 times for refinement and variation",
          },
          {
            name: "Priority access to 24/7 support for faster issue resolution",
          },
        ],
      },
      {
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        // "price_1Sg8JUINKxz4XaqKCOB5rQgE", //-- testing id
        priceId: "price_1Sct5VEZ6GaUMPgO7lXmcKjB", //--live id
        name: "Teacher Plus",
        description:
          "Unlock enhanced AI capabilities and expanded worksheet generation limits for serious educators.",
        price: 5 + "/mo",
        isFree: false,
        priceAnchor: 9,
        monthlyGenerations: 10,
        monthlyPdfs: 5,
        features: [
          {
            name: "Access to advanced AI-powered UI models for smarter worksheet creation",
          },
          {
            name: "Generate quizzes tailored to specific subjects and grade levels",
          },
          { name: "Download up to 5 custom PDFs per month" },
          {
            name: "Regenerate worksheets up to 10 times for refinement and variation",
          },
          {
            name: "Priority access to 24/7 support for faster issue resolution",
          },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Worksheetz Ai <support@support.worksheetzai.com>`,
    // `ShipFast <noreply@resend.shipfa.st>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Worksheetz Ai <support@support.worksheetzai.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "hello@worksheetzai.com",
    replyTo: "hello@worksheetzai.com", // ← Add this
  },
  email: {
    replyTo: "hello@worksheetzai.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode).
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..).
    // For DaisyUI v5, we use a standard primary color
    //main: "#570df8", //8B21F1,
    main: "#8B21F1",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
};

export default config;
