import { notFound } from "next/navigation";

/** Any unknown path below a locale renders the localized not-found page. */
export default function CatchAll() {
  notFound();
}
