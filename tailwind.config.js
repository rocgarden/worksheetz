// tailwind.config.js
const config = require("./config"); // if you want to sync with config.js

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"], // adjust to your project structure
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          //primary: "#8B21F1",
          primary: config.colors.main, // or "#8B21F1" directly
          primaryContent: "#ffffff",
        },
      },
    ],
  },
};
