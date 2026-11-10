import { describe, expect, it } from "vitest";
import { can } from "../auth/permissions";
import { availableTransitions, isTransitionAllowed } from "./moderation";

const as = (role: Parameters<typeof can>[0]["role"]) => (action: Parameters<typeof can>[2]) =>
  can({ role, branchId: null }, "documents", action);

describe("согласование документов каталога", () => {
  it("сотрудник архива отправляет черновик на проверку, но не публикует", () => {
    expect(availableTransitions("DRAFT", as("ARCHIVIST"))).toEqual(["submit"]);
    expect(isTransitionAllowed("publish", "APPROVED", as("ARCHIVIST"))).toBe(false);
  });

  it("модератор одобряет или возвращает на доработку", () => {
    expect(availableTransitions("IN_REVIEW", as("MODERATOR"))).toEqual(["approve", "requestChanges"]);
  });

  it("одобренный документ можно опубликовать", () => {
    expect(isTransitionAllowed("publish", "APPROVED", as("MODERATOR"))).toBe(true);
    expect(isTransitionAllowed("publish", "APPROVED", as("EDITOR"))).toBe(true);
  });

  it("нельзя опубликовать в обход проверки", () => {
    expect(isTransitionAllowed("publish", "DRAFT", as("SUPER_ADMIN"))).toBe(false);
    expect(isTransitionAllowed("publish", "IN_REVIEW", as("SUPER_ADMIN"))).toBe(false);
  });

  it("аналитик ничего не меняет", () => {
    for (const status of ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED"] as const) {
      expect(availableTransitions(status, as("ANALYST"))).toEqual([]);
    }
  });
});

describe("матрица прав", () => {
  it("администратор филиала работает только с филиалами и новостями", () => {
    const user = { role: "BRANCH_ADMIN" as const, branchId: "b1" };
    expect(can(user, "branches", "edit")).toBe(true);
    expect(can(user, "branches", "create")).toBe(false);
    expect(can(user, "documents", "view")).toBe(false);
    expect(can(user, "users", "view")).toBe(false);
  });

  it("пользователями управляют только администраторы", () => {
    expect(can({ role: "SUPER_ADMIN", branchId: null }, "users", "edit")).toBe(true);
    expect(can({ role: "EDITOR", branchId: null }, "users", "view")).toBe(false);
    expect(can({ role: "MODERATOR", branchId: null }, "audit", "view")).toBe(false);
  });
});
