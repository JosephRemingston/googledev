import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Hospitals schema
export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zipCode").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  approved: boolean("approved").notNull().default(false),
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  approved: true,
});

export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;

// Bed types schema
export const bedTypes = pgTable("bedTypes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
});

export const insertBedTypeSchema = createInsertSchema(bedTypes).omit({
  id: true,
});

export type InsertBedType = z.infer<typeof insertBedTypeSchema>;
export type BedType = typeof bedTypes.$inferSelect;

// Beds schema
export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospitalId")
    .notNull()
    .references(() => hospitals.id),
  bedTypeId: integer("bedTypeId")
    .notNull()
    .references(() => bedTypes.id),
  totalBeds: integer("totalBeds").notNull(),
  availableBeds: integer("availableBeds").notNull(),
  pricePerNight: integer("pricePerNight"),
});

export const insertBedSchema = createInsertSchema(beds).omit({
  id: true,
});

export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof beds.$inferSelect;

// Bookings schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  hospitalId: integer("hospitalId")
    .notNull()
    .references(() => hospitals.id),
  bedTypeId: integer("bedTypeId")
    .notNull()
    .references(() => bedTypes.id),
  patientName: text("patientName").notNull(),
  patientPhone: text("patientPhone"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Create the login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
