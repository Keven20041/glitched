import CheckoutClient from "./checkout-client";
import { requireServerAuthSession } from "../lib/auth-session";

export default async function CheckoutPage() {
  const authSession = await requireServerAuthSession("/checkout");

  return <CheckoutClient initialFullName={authSession.user.name ?? ""} initialEmail={authSession.user.email ?? ""} />;
}
