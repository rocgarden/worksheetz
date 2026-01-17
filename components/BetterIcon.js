import React from "react";

// A better way to illustrate with icons
// Pass any SVG icon as children (recommended width/height : w-6 h-6)
// By default, it's using your primary color for styling
const BetterIcon = ({ children, text }) => {
  return (
    // <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-primary/20 text-primary">
    //   <span>{children}</span>
    // </div>
    <div className="w-full md:w-48 flex flex-col gap-2 items-center justify-center">
      <span className="text-4xl">{children}</span>
      <h3 className="text-xl font-semibold text-secondary mb-3">{text}</h3>
    </div>
  );
};

export default BetterIcon;
