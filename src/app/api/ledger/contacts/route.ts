import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertContact, deleteContact } from "@/lib/db/ledger-queries";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      name?: string;
      accent?: string;
      phone?: string | null;
    };
    const nameVal = body.name?.trim();
    const accentVal = body.accent?.trim();
    if (!nameVal || !accentVal) {
      return NextResponse.json({ error: "Missing name or accent" }, { status: 400 });
    }
    const row = await insertContact(
      session.user.id,
      nameVal,
      accentVal,
      body.phone ?? null,
    );
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add contact" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    await deleteContact(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
