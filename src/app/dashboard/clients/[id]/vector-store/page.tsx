"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import VectorStoreTab from "@/components/admin/VectorStoreTab";

function token() { return localStorage.getItem("token") || ""; }

export default function ClientVectorStorePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">&larr; Client</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">Base vectorielle</h1>
      </div>

      <VectorStoreTab clientId={id} token={token} />
    </div>
  );
}
