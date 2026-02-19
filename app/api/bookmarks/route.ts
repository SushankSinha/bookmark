import { createClient } from '@/lib/supabase/server';
import { addBookmark, deleteBookmark } from '@/lib/bookmarks';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, title } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'URL and title are required' }, { status: 400 });
    }

    const result = await addBookmark(supabase, user.id, { url, title });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/bookmarks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bookmark ID is required' }, { status: 400 });
    }

    const result = await deleteBookmark(supabase, id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[DELETE /api/bookmarks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
