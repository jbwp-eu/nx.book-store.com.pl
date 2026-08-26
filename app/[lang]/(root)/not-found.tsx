import { headers } from "next/headers";
import NotFoundView from "@/components/not-found-view";

export default async function NotFound() {
  const raw = (await headers()).get("x-locale");
  return <NotFoundView lang={raw ?? undefined} />;
}
