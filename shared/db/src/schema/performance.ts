import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const performanceTable = pgTable("performance_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  period: text("period").notNull(),
  score: numeric("score").notNull(),
  tasksCompleted: integer("tasks_completed").notNull(),
  tasksFailed: integer("tasks_failed").notNull(),
  efficiency: numeric("efficiency").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPerformanceSchema = createInsertSchema(performanceTable).omit({ id: true, createdAt: true });
export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type PerformanceRecord = typeof performanceTable.$inferSelect;
