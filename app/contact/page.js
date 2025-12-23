import Link from "next/link";
import config from "@/config";
export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-purple-800 mb-6">Contact Us</h1>
      <p className="text-gray-700 mb-8">
        We’re here to help! If you have questions about your account, billing,
        or using {config.appName}, please reach out.
      </p>

      <div className="bg-gray-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Support Email</h2>
        <p className="text-gray-800">
          📧{" "}
          <a
            href={`mailto:${config.resend.supportEmail}`}
            className="text-purple-700 font-medium hover:underline"
          >
            {config.resend.supportEmail}
          </a>
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Other Resources</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>
            <Link
              href="/privacy-policy"
              className="text-purple-700 hover:underline"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/tos" className="text-purple-700 hover:underline">
              Terms of Service
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
