import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const friends = sqliteTable("friends", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  initials: text("initials").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const debts = sqliteTable("debts", {
  id: text("id").primaryKey(),
  friendId: text("friend_id")
    .notNull()
    .references(() => friends.id),
  amount: real("amount").notNull(),
  note: text("note"),
  direction: text("direction", { enum: ["lent", "borrowed"] }).notNull(),
  dateBorrowed: integer("date_borrowed").notNull(),
  dueDate: integer("due_date"),
  status: text("status", { enum: ["pending", "settled", "overdue", "forgiven"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  debtId: text("debt_id")
    .notNull()
    .references(() => debts.id),
  scheduledAt: integer("scheduled_at").notNull(),
  sent: integer("sent").notNull().default(0),
  type: text("type", { enum: ["due_soon", "overdue", "weekly_digest"] }).notNull(),
});
