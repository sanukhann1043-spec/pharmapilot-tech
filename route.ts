import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true, app: "PharmaPilot AI", aiConfigured: Boolean(process.env.AI_API_KEY), searchConfigured: Boolean(process.env.SEARCH_API_KEY), databaseConfigured: Boolean(process.env.DATABASE_URL) }); }
