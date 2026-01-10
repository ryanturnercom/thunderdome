import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listConfigs, saveConfig } from "@/lib/config-storage";
import { SaveConfigRequest } from "@/types/config";

// GET /api/configs - List all configs
export async function GET() {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configs = await listConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error listing configs:", error);
    return NextResponse.json(
      { error: "Failed to list configurations" },
      { status: 500 }
    );
  }
}

// POST /api/configs - Create a new config
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SaveConfigRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const config = await saveConfig(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
