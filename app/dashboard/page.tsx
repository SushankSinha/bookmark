import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBookmarks } from "@/lib/bookmarks";
import BookmarkApp from "@/components/BookmarkApp";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: initialBookmarks } = await getBookmarks(supabase);

  return (
    <BookmarkApp
      user={{
        id: user.id,
        email: user.email ?? "",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        full_name: user.user_metadata?.full_name ?? user.email ?? "User",
      }}
      initialBookmarks={initialBookmarks}
    />
  );
}
