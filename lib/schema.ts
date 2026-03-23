import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";

// 1. visited_locations (位置)
export const visitedLocations = pgTable("visited_locations", {
  id: serial("id").primaryKey(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  name: text("name"),
  comment: text("comment"),
  updated_at: timestamp("updated_at").defaultNow().notNull(), // 最初に登録した日時
  created_at: timestamp("created_at").defaultNow().notNull(), // 情報を更新した日時
});

// 2. visited_places (場所)
export const visitedPlaces = pgTable("visited_places", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => visitedLocations.id, { onDelete: 'cascade' }),
  google_place_id: text("google_place_id"),
  name: text("name"),
  category: text("category"),
  address: text("address"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 3. visited_logs (訪問履歴)
export const visitedLogs = pgTable("visited_logs", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => visitedLocations.id, { onDelete: 'cascade' }),
  place_id: integer("place_id").references(() => visitedPlaces.id, { onDelete: 'cascade' }),
  visited_at: timestamp("visited_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
