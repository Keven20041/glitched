import { createClient } from '@/app/utils/supabase/server';

export default async function Notes() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(notes, null, 2)}
      </pre>
    </div>
  );
}
