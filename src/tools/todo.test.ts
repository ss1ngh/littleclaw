import { test, expect, beforeAll } from "bun:test";
import { prisma } from "../lib/prisma";
import { createTodo, updateTodoProgress } from "./todo";

beforeAll(async () => {
  // Clean up any test data from previous runs
  await prisma.todo.deleteMany({ where: { chatId: "test-user" } });
});

test("createTodo stores items and sets deadline", async () => {
  const todo = await createTodo(
    "test-user",
    "Test tasks",
    "I need to do X, Y, Z",
    ["X", "Y", "Z"],
    "tomorrow",
    "high",
  );

  expect(todo.id).toBeGreaterThan(0);
  expect(todo.title).toBe("Test tasks");
  expect(todo.chatId).toBe("test-user");

  const items = JSON.parse(todo.items);
  expect(items).toEqual(["X", "Y", "Z"]);

  const completedItems = JSON.parse(todo.completedItems);
  expect(completedItems).toEqual([]);

  expect(todo.status).toBe("active");
  expect(todo.deadline.getHours()).toBe(23); // end of day
  expect(todo.deadline.getMinutes()).toBe(59);
});

test("updateTodoProgress marks items as done", async () => {
  const todo = await createTodo(
    "test-user",
    "Progress test",
    "todo A, B",
    ["A", "B"],
  );

  const updated = await updateTodoProgress(todo.id, ["A"]);

  const done = JSON.parse(updated.completedItems);
  expect(done).toEqual(["A"]);
  expect(updated.status).toBe("active");

  // Mark the last one
  const finished = await updateTodoProgress(todo.id, ["B"]);
  expect(finished.status).toBe("completed");
  expect(finished.completedAt).not.toBeNull();
});

test("updateTodoProgress does not duplicate completed items", async () => {
  const todo = await createTodo(
    "test-user",
    "Dedup test",
    "task1",
    ["task1"],
  );

  await updateTodoProgress(todo.id, ["task1"]);
  const again = await updateTodoProgress(todo.id, ["task1"]);

  const done = JSON.parse(again.completedItems);
  expect(done).toEqual(["task1"]); // still just one entry
});

test("createTodo default deadline is end of tomorrow", async () => {
  const todo = await createTodo(
    "test-user",
    "Default deadline",
    "some task",
    ["task"],
  );

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  expect(todo.deadline.getDate()).toBe(tomorrow.getDate());
  expect(todo.deadline.getHours()).toBe(23);
  expect(todo.deadline.getMinutes()).toBe(59);
});
