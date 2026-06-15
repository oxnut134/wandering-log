import { db } from "../../../lib/db";
import { visitedLocations } from "../../../lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = parseInt(session.user.id, 10);

    const { message, history } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const locations = await db.select({
      name: visitedLocations.name,
      comment: visitedLocations.comment,
      latitude: visitedLocations.latitude,
      longitude: visitedLocations.longitude,
    })
      .from(visitedLocations)
      .where(eq(visitedLocations.user_id, currentUserId));

    const locationsText = locations.length > 0
      ? locations.map((l) =>
          `- ${l.name ?? "Unnamed"} (Lat: ${l.latitude}, Lng: ${l.longitude}) Note: ${l.comment ?? "None"}`
        ).join("\n")
      : "(No visit records yet)";

    const systemPrompt = `You are the AI assistant for an app called "Wandering Log". Answer the user's questions in English, referring to their visited location records (visited_locations) as needed.\n\nYour reply will be displayed as a chat message. Do not use Markdown formatting (**, ##, -, etc.) - respond in plain, readable text.\n\n# User's visited locations\n${locationsText}`;

    const conversation = Array.isArray(history)
      ? history
          .filter((h: any) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
          .map((h: any) => ({ role: h.role, content: h.content }))
      : [];

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...conversation, { role: "user", content: message }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock?.type === "text" ? textBlock.text : "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to generate a reply" }, { status: 500 });
  }
}
