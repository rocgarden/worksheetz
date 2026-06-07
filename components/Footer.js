//components/Footer.js
import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import logo from "@/app/icon1.png";


const Footer = () => {
  return (
    <footer className="border-t border-purple-800/30  bg-purple-950 text-white">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className=" flex lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
          <div className="w-64 flex-shrink-0 md:mx-0 mx-auto text-center md:text-left">
            <Link
              href="/"
              className="flex items-center gap-3 justify-center md:justify-start"
            >
              <Image
                src={logo}
                alt="TEKS Portfolio"
                priority
                width={46}
                height={46}
                className="w-11 h-11 object-contain"
              />

              <div className="text-left">
                <div className="font-black text-xl tracking-tight">
                  TEKS Portfolio
                </div>

                <div className="text-xs text-purple-200">
                  Practice • Progress • Proficiency
                </div>
              </div>
            </Link>

            <p className="mt-3 text-sm text-white">{config.appDescription}</p>
           <p className="mt-6 text-sm text-purple-200">
              © {new Date().getFullYear()} TEKS Portfolio
            </p>

          </div>
          <div className="flex-grow flex flex-wrap justify-center -mb-10 md:mt-0 mt-10 text-center">
            <div className="lg:w-1/3 md:w-1/2 w-full px-4 ">
              <div className="footer-title font-semibold text-white tracking-widest text-sm md:text-left mb-3">
                <p className="text-white">LINKS</p>
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                {config.resend.supportEmail && (
                  <>
                    <a
                      href={`mailto:${config.resend.supportEmail}`}
                      target="_blank"
                      className="link link-hover"
                      aria-label="Contact Support"
                    >
                      Support
                    </a>
                  </>
                )}
                <Link href="/#pricing" className="link link-hover">
                  Pricing
                </Link>
                <Link href="/contact" className="link link-hover">
                  Contact
                </Link>
                <Link href="/about" className="link link-hover">
                  About
                </Link>
                {/* <span className="text-base-content/80">Contact us:</span> */}
                <a
                  href={`mailto:${config.resend.supportEmail}`}
                  className="link link-hover text-white font-medium"
                >
                  {config.resend.supportEmail}
                </a>
                {/* <a href="/#" target="_blank" className="link link-hover">
                  Affiliates
                </a> */}
              </div>
            </div>

            <div className="lg:w-1/3 md:w-1/2 w-full px-4">
              <div className="footer-title font-semibold text-white tracking-widest text-sm md:text-left mb-3">
                LEGAL
              </div>

              <div className="flex flex-col justify-center items-center md:items-start gap-2 mb-10 text-sm">
                <Link href="/tos" className="link link-hover">
                  Terms of Services
                </Link>
                <Link href="/privacy-policy" className="link link-hover">
                  Privacy Policy
                </Link>
                <Link href="/refund-policy" className="link link-hover">
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
