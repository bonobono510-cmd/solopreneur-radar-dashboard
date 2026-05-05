import { NextResponse } from "next/server";
import { fetchAllItems } from "@/lib/sheets";

export const revalidate = 60;

export async function GET() {
  try {
    const items = await fetchAllItems();
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    return NextResponse.json(
      { error: (e && e.message) || "fetch failed" },
      { status: 500 }
    );
  }
}
