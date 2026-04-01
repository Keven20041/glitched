import OrdersClient from "./orders-client";
import { requireServerAuthSession } from "@/app/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const authSession = await requireServerAuthSession("/account/orders");

  return <OrdersClient userName={authSession.user.name ?? undefined} userEmail={authSession.user.email ?? undefined} />;
}
