import Link from "next/link";
import { MARKETING_CONSENT_TEXT } from "@/content/site";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

/** Marketing consent: optional, unticked by default, separate from the Terms (NDPA 2023). */
export function ConsentCheckbox({ checked, onChange, id = "marketing-consent" }: ConsentCheckboxProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-neutral-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-primary-800 focus:ring-primary-800"
      />
      <span>{MARKETING_CONSENT_TEXT}</span>
    </label>
  );
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
