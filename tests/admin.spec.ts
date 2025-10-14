import { test, expect } from "playwright-test-coverage";
import { basicInit } from "./utils/testHelpers";

test("admin dashboard goes to not found if not admin", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await expect(page.getByText("Oops")).toBeVisible();
});

test("admin login and navigate to dashboard", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  await page.getByRole("link", { name: "Admin" }).click();

  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Franchises" })).toBeVisible();
});

test("admin dashboard and close franchise", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();

  await expect(page.getByRole("columnheader", { name: "Franchise", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "LotaPizza" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "PizzaCorp" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "topSpot" })).toBeVisible();

  await page.getByRole("row", { name: "topSpot Close" }).getByRole("button").click();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Franchises" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "LotaPizza" })).toBeVisible();
});

test("admin dashboard and create franchise", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await page.getByRole("button", { name: "Add Franchise" }).click();

  await expect(page.getByText("Create franchise", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "franchise name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "franchisee admin email" })).toBeVisible();

  await page.getByRole("textbox", { name: "franchise name" }).fill("Santaquin");
  await page.getByRole("textbox", { name: "franchisee admin email" }).fill("f@jwt.com");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("heading", { name: "Franchises" })).toBeVisible();
});

test("admin dashboard and close store", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();

  await page.getByRole("row", { name: "Springville ₿ Close" }).getByRole("button").click();
  await expect(page.getByText("Sorry to see you go")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Franchises" })).toBeVisible();
});