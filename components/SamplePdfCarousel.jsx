"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function SamplePdfCarousel() {
  const images = [
    {
      src: "/samples/social-studies-pdf.png",
      alt: "Social Studies Worksheet Sample",
      label: "Social Studies",
    },
    {
      src: "/samples/grammar-pdf.png",
      alt: "Grammar Worksheet Sample",
      label: "Grammar",
    },
    {
      src: "/samples/reading-pdf.png",
      alt: "Reading Worksheet Sample",
      label: "Reading",
    },
    {
      src: "/samples/grammar2-pdf.png",
      alt: "Grammar 2 Worksheet Sample",
      label: "Grammar",
    },
  ];

  //const loopImages = [...images, ...images]; // continuous loop
  const [isTransitioning, setIsTransitioning] = useState(true);

  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);
  const next = () => {
    setIsTransitioning(true);
    setIndex((prev) => prev + 1);
  };
  //const next = () => setIndex((index + 1) % images.length);
  //const prev = () => setIndex((index - 1 + images.length) % images.length);
  // Auto-slide every 4 seconds
  useEffect(() => {
    startAutoSlide();
    return stopAutoSlide;
  }, []);
  const startAutoSlide = () => {
    stopAutoSlide();
    intervalRef.current = setInterval(next, 4000);
  };
  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Reset index seamlessly when reaching halfway
  useEffect(() => {
    if (index >= images.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setIndex(0);
      }, 700); // matches transition duration
    }
  }, [index]);

  return (
    <section className="bg-gradient-to-b from-purple-500 via-purple-400 to-purple-300 text-neutral-content">
      {/* <section className="text-neutral-content"> */}
      <div className=" px-8 py-4 md:py-14 text-center">
        {/* SEO-Friendly Heading */}{" "}
        <h2 className="text-center sm:text-4xl font-bold text-white/90 py-4 tracking-light">
          {" "}
          Featured Worksheets{" "}
        </h2>{" "}
        <p className="text-white/90 max-w-3xl mx-auto">
          Sample worksheets created by AI — tailored to your subject, grade
          level, and goals.
        </p>
        {/* Carousel Wrapper */}{" "}
        <div
          className="relative p-4 max-w-6xl mx-auto rounded-md w-full overflow-hidden"
          // onMouseEnter={stopAutoSlide}
          // onMouseLeave={startAutoSlide}
        >
          {" "}
          {/* Fade edges */}
          {/* <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-purple-700 to-transparent z-20"></div> */}
          {/* <div className="pointer-events-none absolute right-0 top-0 h-full w-30 bg-gradient-to-l from-purple-700 to-transparent z-20"></div> */}
          {/* Smooth Auto-Scroll Track */}
          <div className="flex flex-nowrap whitespace-nowrap min-w-[200%] animate-scroll gap-4">
            {" "}
            {[...images, ...images].map((img, i) => (
              <div key={i} className="min-w-[260px]">
                {" "}
                <div className="rounded-lg overflow-hidden shadow-2xl border border-purple-900">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={260}
                    height={380}
                    className=" w-full object-cover "
                  />{" "}
                </div>{" "}
                {/* Caption */}
                <p className="text-left text-white/90 text-md mt-2 ml-1">
                  {img.label}
                </p>
              </div>
            ))}{" "}
          </div>{" "}
          {/* Left Button */}{" "}
          {/* <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-purple-200 hover:bg-purple-300 text-purple-800 px-3 py-2 rounded-full shadow"
          >
            {" "}
            ‹{" "}
          </button>{" "} */}
          {/* Right Button */}{" "}
          {/* <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-200 hover:bg-purple-300 text-purple-800 px-3 py-2 rounded-full shadow"
          >
            {" "}
            ›{" "}
          </button>{" "} */}
        </div>{" "}
        {/* Dots */}{" "}
        <div className="flex justify-center mt-4 gap-2">
          {" "}
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-3 w-3 rounded-full transition-all ${index === i ? "bg-purple-300 scale-110" : "bg-gray-300"}`}
            />
          ))}{" "}
        </div>{" "}
      </div>
    </section>
  );
}

// return (
//   <section className="bg-gradient-to-b from-purple-700 via-purple-600 to-purple-500 text-neutral-content">
//     <div className=" px-8 py-4 md:py-14 text-center">
//       {/* SEO-Friendly Heading */}{" "}
//       <h2 className="flex sm:text-4xl font-semi-bold text-white/90 py-4 tracking-light">
//         {" "}
//         Featured Sample Worksheets{" "}
//       </h2>{" "}
//       {/* Carousel Wrapper */}{" "}
//       <div
//         className="relative p-4 rounded-xl w-full overflow-hidden"
//         onMouseEnter={stopAutoSlide}
//         onMouseLeave={startAutoSlide}
//       >
//         {" "}
//         {/* Slider Track */}{" "}
//         <div
//           className={`flex max-w-6xl mx-auto ${isTransitioning ? "transition-transform duration-700 ease-out" : ""}`}
//           style={{
//             transform: `translateX(-${index * 28}%)`,
//             width: `${loopImages.length * 28}%`,
//           }}
//         >
//           {" "}
//           {loopImages.map((img, i) => (
//             <div key={i} className="snap-x w-1/4 px-2 flex-shrink-0 ">
//               {" "}
//               <div className="relative rounded-lg overflow-hidden ">
//                 {" "}
//                 <Image
//                   src={img.src}
//                   alt={img.alt}
//                   width={260}
//                   height={380}
//                   className="snap-center w-full object-cover rounded-lg border-2 border-purple-800 shadow-2xl"
//                 />{" "}
//                 {/* <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div> */}
//                 {/* <div className="absolute inset-0 bg-black opacity-10"></div> */}
//                 {/* Caption */}
//                 <p className="text-left text-white/90 text-md mt-2 ml-1">
//                   {img.label}
//                 </p>
//               </div>{" "}
//             </div>
//           ))}{" "}
//         </div>{" "}
//         {/* Left Button */}{" "}
//         {/* <button
//             onClick={prev}
//             className="absolute left-3 top-1/2 -translate-y-1/2 bg-purple-200 hover:bg-purple-300 text-purple-800 px-3 py-2 rounded-full shadow"
//           >
//             {" "}
//             ‹{" "}
//           </button>{" "} */}
//         {/* Right Button */}{" "}
//         {/* <button
//             onClick={next}
//             className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-200 hover:bg-purple-300 text-purple-800 px-3 py-2 rounded-full shadow"
//           >
//             {" "}
//             ›{" "}
//           </button>{" "} */}
//       </div>{" "}
//       {/* Dots */}{" "}
//       <div className="flex justify-center mt-4 gap-2">
//         {" "}
//         {images.map((_, i) => (
//           <button
//             key={i}
//             onClick={() => setIndex(i)}
//             className={`h-3 w-3 rounded-full transition-all ${index === i ? "bg-purple-300 scale-110" : "bg-gray-300"}`}
//           />
//         ))}{" "}
//       </div>{" "}
//     </div>
//   </section>
// );
