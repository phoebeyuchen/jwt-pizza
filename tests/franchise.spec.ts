import { test, expect } from "playwright-test-coverage";
import { basicInit } from "./utils/testHelpers";

test("franchise page", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Global").getByRole("link", { name: "Franchise" }).click();
  await expect(page.getByRole("main")).toContainText("So you want a piece of the pie?");
});

test("franchisee login and navigate", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByLabel("Global").getByRole("link", { name: "Franchise" })).toBeVisible();
  await page.getByLabel("Global").getByRole("link", { name: "Franchise" }).click();

  await expect(page.getByText("PizzaCorp")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
});

test("franchisee dashboard and close store", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Global").getByRole("link", { name: "Franchise" }).click();

  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Sorry to see you go")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("PizzaCorp")).toBeVisible();
});

test("franchisee dashboard and create store", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("Global").getByRole("link", { name: "Franchise" }).click();

  await page.getByRole("button", { name: "Create store" }).click();
  await page.getByRole("textbox", { name: "store name" }).fill("Santaquin");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("PizzaCorp")).toBeVisible();
});