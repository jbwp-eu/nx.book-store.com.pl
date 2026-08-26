import { expect, test } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("home page loads and links to search", async ({ page }) => {
    await page.goto("/pl");
    await expect(page.getByRole("heading").first()).toBeVisible();
    const viewAll = page.getByRole("link", { name: /wszystkie|view all/i });
    if (await viewAll.count()) {
      await viewAll.first().click();
      await expect(page).toHaveURL(/\/pl\/search/);
    }
  });

  test("search filters include in-stock option", async ({ page }) => {
    await page.goto("/pl/search");
    await expect(
      page.getByRole("heading", { name: /dostępność|availability/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /w magazynie|in stock/i }).click();
    await expect(page).toHaveURL(/stock=in-stock/);
  });

  test("product page has enlargeable image dialog", async ({ page }) => {
    await page.goto("/pl/search");
    const productLink = page.locator('a[href*="/pl/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });
    await productLink.click();
    await expect(page).toHaveURL(/\/pl\/product\//);
    const imageButton = page.locator("button").filter({ has: page.locator("img") }).first();
    await imageButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("auth & purchase path", () => {
  test("sign-in page exposes forgot password", async ({ page }) => {
    await page.goto("/pl/sign-in");
    await expect(page.getByRole("heading", { name: /zaloguj/i })).toBeVisible();
    await page.getByRole("link", { name: /hasła|forgot/i }).click();
    await expect(page).toHaveURL(/\/pl\/forgot-password/);
  });

  test("guest can open product and add to cart", async ({ page }) => {
    await page.goto("/pl/search");
    const productLink = page.locator('a[href*="/pl/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });
    await productLink.click();

    const addButton = page.getByRole("button", {
      name: /dodaj do koszyka|add to cart/i,
    });
    if (await addButton.count()) {
      await addButton.first().click();
      await page.goto("/pl/cart");
      await expect(page.getByRole("heading", { name: /koszyk|cart/i })).toBeVisible();
    }
  });
});

test.describe("admin CRUD", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests",
  );

  test("admin can open products list and create form", async ({ page }) => {
    await page.goto("/pl/sign-in");
    await page.locator("#email").fill(process.env.E2E_ADMIN_EMAIL!);
    await page.locator("#password").fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /zaloguj|sign in/i }).click();
    await page.waitForURL(/\/pl(?!\/sign-in)/);

    await page.goto("/pl/admin/products");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.getByRole("link", { name: /utwórz|create/i }).first().click();
    await expect(page).toHaveURL(/\/pl\/admin\/products\/create/);
    await expect(page.locator('input[name="name"], #name').first()).toBeVisible();
  });
});
