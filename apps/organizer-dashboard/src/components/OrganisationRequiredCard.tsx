"use client";

import { Card, Button } from "@silvertrails/ui";
import Link from "next/link";

type OrganisationRequiredCardProps = {
  message?: string;
  className?: string;
};

export function OrganisationRequiredCard({
  message = "Please join an organisation.",
  className = "",
}: OrganisationRequiredCardProps) {
  return (
    <Card
      className={`p-6 mt-6 border border-amber-200 bg-amber-50 text-amber-900 space-y-3 ${className}`}
    >
      <h3 className="text-lg font-semibold">Organisation access required</h3>
      <p className="text-sm">{message}</p>
      <Button
        asChild
        variant="outline"
        className="border-amber-300 text-amber-900"
      >
        <Link href="/organisations">Go to Organisations</Link>
      </Button>
    </Card>
  );
}
