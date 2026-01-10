import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getConfig, updateConfig, deleteConfig } from "@/lib/config-storage";
import { SaveConfigRequest } from "@/types/config";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/configs/[id] - Get a specific config
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const config = await getConfig(id);
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error getting config:", error);
    return NextResponse.json(
      { error: "Failed to get configuration" },
      { status: 500 }
    );
  }
}

// PUT /api/configs/[id] - Update a config
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body: SaveConfigRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const config = await updateConfig(id, body);
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}

// DELETE /api/configs/[id] - Delete a config
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await deleteConfig(id);
    if (!success) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting config:", error);
    return NextResponse.json(
      { error: "Failed to delete configuration" },
      { status: 500 }
    );
  }
}
