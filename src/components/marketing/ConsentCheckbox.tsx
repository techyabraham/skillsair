import Link from "next/link";
import { MARKETING_CONSENT_TEXT } from "@/content/site";

/** Everyone who gives their details is on the list until they opt out; this tells them so. */
export function ConsentNotice() {
  return <p className="text-sm text-neutral-700">{MARKETING_CONSENT_TEXT}</p>;
}

export function PrivacyNote() {
  return (
    <p className="text-center text-xs text-neutral-500">
      🔒 We protect your data and never sell it.{" "}
      <Link href="/privacy" className="font-medium text-primary-800 underline underline-offset-2">
        Privacy notice
      </Link>
    </p>
  );
}
