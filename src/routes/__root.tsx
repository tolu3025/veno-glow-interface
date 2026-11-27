import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";

const startupRecoveryScript = `
(() => {
  const key = "kukapay-startup-recovery";
  const recover = async (message) => {
    if (!/Failed to fetch dynamically imported module|Importing a module script failed/i.test(message || "")) return;
    const lastAttempt = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - lastAttempt < 30000) return;
    sessionStorage.setItem(key, String(Date.now()));
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.allSettled(names.map((name) => caches.delete(name)));
      }
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set("app-recovery", String(Date.now()));
      window.location.replace(url.toString());
    }
  };
  window.addEventListener("error", (event) => recover(event.message));
  window.addEventListener("unhandledrejection", (event) => recover(String(event.reason?.message || event.reason || "")));
})();
`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "KukaPay — Campus Wallet" },
      { name: "description", content: "Zero-fee campus wallet for students." },
      { name: "theme-color", content: "#6C5CE7" },
      { property: "og:title", content: "KukaPay — Campus Wallet" },
      { name: "twitter:title", content: "KukaPay — Campus Wallet" },
      { property: "og:description", content: "Zero-fee campus wallet for students." },
      { name: "twitter:description", content: "Zero-fee campus wallet for students." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "KukaPay" },
      { name: "application-name", content: "KukaPay" },
      { name: "apple-mobile-web-app-title", content: "KukaPay" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "author", content: "Kuka Technology and Innovation Ltd" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "KukaPay",
          alternateName: "Kuka Pay",
          url: "https://app.kukapay.com.ng",
          publisher: {
            "@type": "Organization",
            name: "Kuka Technology and Innovation Ltd",
            url: "https://app.kukapay.com.ng",
          },
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/kukapay-icon.png" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/icons/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="root">{children}</div>
        <script dangerouslySetInnerHTML={{ __html: startupRecoveryScript }} />
        <Scripts />
      </body>
    </html>
  );
}
