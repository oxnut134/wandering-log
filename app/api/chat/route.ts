import { streamText, convertToModelMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { db } from "../../../lib/db";
import { visitedLocations } from "../../../lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const anthropicProvider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = parseInt(session.user.id, 10);

    const { messages } = await request.json();

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

    const modelMessages = await convertToModelMessages(messages.slice(-5));

    const result = streamText({
      model: anthropicProvider("claude-haiku-4-5-20251001"),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 1024,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to generate a reply" }, { status: 500 });
  }
}
