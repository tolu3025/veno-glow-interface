import { createFileRoute } from "@tanstack/react-router";
import KukaPayApp from "@/AppClient";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "KukaPay — Student Campus Wallet" },
    { name: "description", content: "Manage your KukaPay wallet, campus payments, collections, and savings." },
    { property: "og:title", content: "KukaPay — Student Campus Wallet" },
    { property: "og:description", content: "Manage your KukaPay wallet, campus payments, collections, and savings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: KukaPayApp,
});
