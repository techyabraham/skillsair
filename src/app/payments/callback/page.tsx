import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { PaymentCallback } from "@/components/checkout/PaymentCallback";

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>}>
      <PaymentCallback />
    </Suspense>
  );
}
