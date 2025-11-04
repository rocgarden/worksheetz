// //libs/api.js
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import { redirect } from "next/navigation";
// import config from "@/config";

// // use this to interact with our own API (/app/api folder) from the front-end side
// // See https://shipfa.st/docs/tutorials/api-call
// const apiClient = axios.create({
//   baseURL: "/api",
// });

// apiClient.interceptors.response.use(
//   function (response) {
//     return response.data;
//   },
//   function (error) {
//     let message = "";

//     if (error.response?.status === 401) {
//       // User not auth, ask to re login
//       //toast.error("Please login");
//       if (typeof window !== "undefined" && toast?.error) {
//         toast.error("Please login" || "Something went wrong...");
//       } else {
//         console.error("API error:", error.message);
//       }

//       // Sends the user to the login page
//       redirect(config.auth.loginUrl);
//     } else if (error.response?.status === 403) {
//       // User not authorized, must subscribe/purchase/pick a plan
//       message = "Pick a plan to use this feature";
//     } else {
//       message =
//         error?.response?.data?.error || error.message || error.toString();
//     }

//     error.message =
//       typeof message === "string" ? message : JSON.stringify(message);

//     console.error(error.message);

//     // Automatically display errors to the user
//     if (error.message) {
//       // toast.error(error.message);
//       if (typeof window !== "undefined" && toast?.error) {
//         toast.error(error.message || "Something went wrong...");
//       } else {
//         console.error("API error:", error.message);
//       }
//     } else {
//       //toast.error("something went wrong...");
//       if (typeof window !== "undefined" && toast?.error) {
//         toast.error(error.message || "Something went wrong...");
//       } else {
//         console.error("API error:", error.message);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default apiClient;

// libs/api.js
import axios from "axios";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";
import config from "@/config";

// Helper: determine the correct base URL
function getBaseURL() {
  if (typeof window !== "undefined") {
    // Client-side (browser)
    return "/api";
  }

  // Server-side (Next.js SSR)
  // Use absolute URL
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api`;
}

// Create axios instance dynamically
const apiClient = axios.create({
  baseURL: getBaseURL(),
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = "";

    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && toast?.error) {
        toast.error("Please login" || "Something went wrong...");
      } else {
        console.error("API error:", error.message);
      }

      redirect(config.auth.loginUrl);
    } else if (error.response?.status === 403) {
      message = "Pick a plan to use this feature";
    } else {
      message =
        error?.response?.data?.error || error.message || error.toString();
    }

    error.message =
      typeof message === "string" ? message : JSON.stringify(message);

    console.error(error.message);

    if (typeof window !== "undefined" && toast?.error) {
      toast.error(error.message || "Something went wrong...");
    } else {
      console.error("API error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
