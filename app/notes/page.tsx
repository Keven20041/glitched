import { createClient } from '@/app/utils/supabase/server';
import { requireServerAuthSession } from "@/app/lib/auth-session";

export default async function Notes() {
  const authSession = await requireServerAuthSession("/notes");
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      <p className="mb-4 text-sm text-gray-600">Signed in as {authSession.user.email ?? authSession.user.id}</p>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(notes, null, 2)}
      </pre>
    </div>
  );
}
