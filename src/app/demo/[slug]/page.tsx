import { notFound } from "next/navigation";
import { findClientBySlug } from "@/lib/auth";
import { DemoClient } from "./demo-client";

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) notFound();

  return (
    <DemoClient
      slug={slug}
      name={client.name || slug}
      primary={client.primaryColor || "#059669"}
      logo={client.logo || ""}
    />
  );
}