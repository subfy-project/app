import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Dashboard", href: "/whitelist" },
  ],
  Developers: [
    { label: "Documentation", href: "https://github.com/subfy-project/app" },
    { label: "SDK Reference", href: "#" },
    { label: "API Endpoints", href: "#" },
    { label: "GitHub", href: "https://github.com/subfy-project/app" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-dark-500">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Logo.svg" alt="Subfy" className="h-7" />
            </Link>
            <p className="font-outfit text-body-xs leading-relaxed text-text-secondary">
              The future of on-chain recurring payments. Built on Stellar,
              powered by Soroban.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-4">
              <h4 className="font-inter text-body-sm font-semibold text-text-primary">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="font-outfit text-body-xs text-text-secondary transition-colors duration-200 hover:text-text-primary"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="font-outfit text-body-xs text-text-secondary transition-colors duration-200 hover:text-text-primary"
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          link.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-dark-500/50 pt-8 md:flex-row">
          <p className="font-outfit text-body-xs text-text-secondary">
            &copy; {new Date().getFullYear()} Subfy. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-outfit text-body-xs text-text-secondary">
              Built on
              <img
                src="/stellar-xlm-logo.svg"
                alt="Stellar"
                className="size-4 brightness-0 invert"
              />
              <span className="font-semibold text-text-primary">Stellar</span>
            </span>
            <span className="text-dark-500">|</span>
            <span className="flex items-center gap-1.5 font-outfit text-body-xs text-text-secondary">
              Powered by
              <span className="font-semibold text-text-primary">Soroban</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
