import { createFileRoute } from "@tanstack/react-router";
import KukaPayApp from "@/AppClient";

export const Route = createFileRoute("/$")({
  ssr: false,
  head: () => ({ meta: [
    { title: "KukaPay — Campus Payments & Services" },
    { name: "description", content: "Access KukaPay student payments, class collections, and campus services." },
    { property: "og:title", content: "KukaPay — Campus Payments & Services" },
    { property: "og:description", content: "Access KukaPay student payments, class collections, and campus services." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: KukaPayApp,
});
