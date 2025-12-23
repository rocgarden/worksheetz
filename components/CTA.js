import config from "@/config";
import ButtonSignin from "./ButtonSignin";

const CTA = ({ isAuthenticated = false }) => {
  return (
    // <section className="bg-gradient-to-b from-purple-800 via-purple-700 to-purple-900 text-white py-16 px-6">
    <section className="bg-white text-gray-900 py-36 px-6">
      {" "}
      <div className="max-w-4xl mx-auto text-center">
        {" "}
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
          {" "}
          Ready to Create Beautiful Worksheets in{" "}
          <span className="bg-purple-700 px-1 text-white rounded-sm">
            {" "}
            minutes{" "}
          </span>{" "}
          ?{" "}
        </h2>{" "}
        <div className="flex justify-center mb-6">
          {" "}
          <span className="text-4xl">⏱️</span>{" "}
        </div>
        <p className="text-lg md:text-xl text-purple-500 max-w-2xl mx-auto mb-10">
          Generate unlimited, high‑quality worksheets for any subject using AI.
          Save time, stay organized, and give your students the best learning
          experience.
        </p>
        <div className="mt-8">
          {!isAuthenticated ? (
            <ButtonSignin
              redirectTo={`/checkout?priceId=${config.stripe.plans[0].priceId}`}
              extraStyle="btn-primary"
              text="Get Worksheetz Ai"
            />
          ) : (
            <p className="text-sm text-base-content/70 text-center"></p>
          )}
        </div>
      </div>{" "}
    </section>
  );
};

export default CTA;

// <section className="relative hero overflow-hidden min-h-screen">
//   <Image
//     src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
//     alt="Background"
//     className="object-cover w-full"
//     fill
//   />
//   <div className="relative hero-overlay bg-neutral bg-opacity-70"></div>
//   <div className="relative hero-content text-center text-neutral-content p-8">
//     <div className="flex flex-col items-center max-w-xl p-8 md:p-0">
//       <h2 className="font-bold text-3xl md:text-5xl tracking-tight mb-8 md:mb-12">
//         Boost your app, launch, earn
//       </h2>
//       <p className="text-lg opacity-80 mb-12 md:mb-16">
//         Don&apos;t waste time integrating APIs or designing a pricing
//         section...
//       </p>

//       <button className="btn btn-primary btn-wide">
//         Get {config.appName}
//       </button>
//     </div>
//   </div>
// </section>
