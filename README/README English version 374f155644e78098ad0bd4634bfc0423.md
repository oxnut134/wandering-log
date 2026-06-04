# README / English version

## Wandering-Log

### Project Name: wandering-log

### 1) Overview

This app was developed to record visited locations regardless of region or category. Using the Google Maps API, users can pin locations on a map and save records. Google place information can be retrieved and used, and users can also manually enter information when Google data is unavailable. The app was originally inspired by a Japanese TV show about bar-hopping, hence the name, but it can also be used for business sales activities or as a travel diary.

Special attention was given to the behavior of markers and modals on the map to ensure a smooth user experience. The current version covers basic recording and viewing functionality, with plans to add search and list display features in the future.

Deploy URL: [https://wandering-log.vercel.app](https://wandering-log.vercel.app/)

- In this demo version, the default home location is set to Times Square in NY. In the production version, it will automatically use the user's current location.
- You can try the demo using the following credentials:
Email: [demo@example.com](mailto:demo@example.com)
Password: demo1234

【Register a new location on mobile】

![image.png](image.png)

【View locations on desktop】

![image.png](image%201.png)

![image.png](image%202.png)

### 【Feature Overview】

① Location Registration

- Registers the location (latitude, longitude), name, and comment of the visited place.

② Google Information Retrieval

- Retrieves and saves Google place information (name, address, category, TEL, E-mail).

③ Visit History Display

- Displays the visit history for each location.

④ Visit Memo

- Saves memos and comments for each visit date.

④ Map Navigation

- Current Location Button: Moves the map to the current location.
- Home Button: Moves the map to the registered Home point.
- Red Marker Button: Moves the red marker to the center of the screen.

⑤ Modal Operations

- Modal Move: Drag modals to reposition them freely.
- Focus Function: Focuses modals of the same location group and brings them to the front.
- Align Function: Aligns modals of the same location group.
- Float Function: Brings any modal to the front.

**How to Use**

① User registration and login follow standard procedures.

② Registering a New Location
Move the red marker to the target location and click it. A Location modal will appear — confirm the name and click "Visit". A yellow marker will appear below the red marker upon success.
Buttons:

- Google info: Opens the Google modal with retrieved place information. Buttons allow viewing the Google Maps page or website. Click "Reflect this information" to save Google data to the parent modal.
- 🏠 move: Registers the current point as Home.

③ Existing Location
Click a yellow marker to open the Location modal. Name and comment are editable.
Buttons:

- Visit: Adds the current date and time to the visit history.
- Save: Saves the displayed information.
- Google info: Opens the Google modal with retrieved place information.
- Visit Logs: Opens the Logs modal showing a list of past visit dates. Clicking a date opens the Comment modal where comments can be edited and saved.

④ Modal Operations
Modals can be freely moved by dragging the gray area.

- Focus: Click a modal to highlight the same group with a red border and bring it to the front.
- Align: Moving a Location modal more than 100px causes all modals in the same group to gather and align.
- Float: Double-click any modal to bring it to the front.

### 2) Purpose

Portfolio project

### 3) Application URL

**GitHub Repository URL:** [git@github.com](mailto:git@github.com):oxnut134/wandering-log.git

jsx

`git clone git@github.com:oxnut134/wandering-log.git`

### 4) Feature List

`User Registration
Login / Logout
Location Registration
Google Information Retrieval
Visit History Display
Visit Memo`

### 5) Tech Stack

### Frontend

- **Next.js** 16.2.0 (Turbopack)
- **React** 19.2.4
- **Google Maps JavaScript API**
- **Google Places API**
- **React-Hook-Form** 7.75.0

### Backend

- **Next.js** 16.2.0 (Turbopack)
- **NextAuth.js**
- **Neon (PostgreSQL)**

### 6) Table Design

### Table Specifications

**1. `users` (User information: Name, Email, Password)**

| Column | Type | Description | Null |
| --- | --- | --- | --- |
| **id** | Serial (PK) | User identifier |  |
| **name** | text | Username |  |
| **email** | text | Email | ○ |
| **password** | text | Password | ○ |
| **updated_at** | Timestamp | Last updated date |  |
| **created_at** | Timestamp | Registration date |  |

**2. `visited_locations` (Location: Coordinates and basic information)**

The central "location" table. Holds coordinates and memos for each place.

| Column | Type | Description | Null |
| --- | --- | --- | --- |
| **id** | Serial (PK) | Location identifier |  |
| **user_id** | Integer (FK) | User ID |  |
| **latitude** | Decimal | Latitude |  |
| **longitude** | Decimal | Longitude |  |
| **name** | Text | Store/facility/building name | ○ |
| **comment** | Text | Memo entered in comment modal | ○ |
| **updated_at** | Timestamp | Last updated date |  |
| **created_at** | Timestamp | Registration date |  |

**3. `visited_places` (Place: Facility entity retrieved from Google)**

Store or facility information linked to a location. Managed in the place modal.

| Column | Type | Description | Null |
| --- | --- | --- | --- |
| **id** | Serial (PK) | Facility identifier |  |
| **location_id** | Integer (FK) | Reference to `visited_locations.id` |  |
| **google_place_id** | String | Google unique ID | ○ |
| **name** | Text | Store/facility name | ○ |
| **category** | Text | Category (restaurant, apparel, etc.) | ○ |
| **address** | Text | Address | ○ |
| **updated_at** | Timestamp | Last updated date |  |
| **created_at** | Timestamp | Registration date |  |

**4. `visited_logs` (Visit History: When and where)**

History data recording how many times a place has been visited.

| Column | Type | Description | Null |
| --- | --- | --- | --- |
| **id** | Serial (PK) | History identifier |  |
| **user_id** | Integer (FK) | Reference to `user.id` |  |
| **location_id** | Integer (FK) | Reference to `visited_location.id` | ○ |
| **place_id** | Integer (FK) | Reference to `visited_places.id` | ○ |
| **visited_at** | Timestamp | Visit date |  |
| **updated_at** | Timestamp | Last updated date |  |
| **created_at** | Timestamp | Registration date |  |

**5. `visited_comments` (Visit Memo: Memos and comments per visit)**

Memos and comments for each visit.

| Column | Type | Description | Null |
| --- | --- | --- | --- |
| **id** | Serial (PK) | Comment identifier |  |
| **user_id** | Integer (FK) | Reference to `user.id` |  |
| **log_id** | Integer (FK) | Reference to `visited_log.id` | ○ |
| **comment** | text | Comment | ○ |
| **updated_at** | Timestamp | Last updated date |  |
| **created_at** | Timestamp | Registration date |  |

### 7) ER Diagram

![image.png](image%203.png)

### 8) Setup

### 8-1) Basic Configuration

This project integrates frontend and backend using Next.js. The project directory is `wandering-log`, with the backend placed under `app/api`.

### Directory Structure

`wandering-log
├── AGENTS.md
├── app
|  ├── api/
|  ├── components/
|  ├── context/
|  └── page.tsx
├── lib/
├── public/
└── README.md`

### Clone the project

bash

`git clone git@github.com:oxnut134/wandering-log.git`

### 8-2) Frontend Setup

**Install dependencies**

bash

`npm install`

**Create environment file**

bash

`# cmd
copy null > .env.local
# PowerShell
New-Item .env.local

# Add the following to .env.local:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY =
DATABASE_URL =`

**Start Next.js**

bash

`npm run dev`

### 8-3) Backend Setup

This project uses Neon (PostgreSQL) for the database.

bash

`npx drizzle-kit push`

/lib/schema.ts

```tsx
import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  password: text("password").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const visitedLocations = pgTable("visited_locations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  name: text("name"),
  comment: text("comment"),
  updated_at: timestamp("updated_at").defaultNow().notNull(), 
  created_at: timestamp("created_at").defaultNow().notNull(), 
});

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

export const visitedLogs = pgTable("visited_logs", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").references(() => visitedLocations.id, { onDelete: 'cascade' }),
  user_id: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  place_id: integer("place_id").references(() => visitedPlaces.id, { onDelete: 'cascade' }),
  visited_at: timestamp("visited_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const visitedComments = pgTable("visited_comments", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  log_id: integer("log_id").references(() => visitedLogs.id, { onDelete: 'cascade' }),
  comment: text("comment"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

```

## ９）Testing

Run tests with:
`npm run test:run` 
24 tests passing