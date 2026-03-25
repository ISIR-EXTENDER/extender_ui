import { expect, test } from "@playwright/test";

test("opens the sandbox runtime from home", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  await page.getByRole("button", { name: /SandboxV0\.0/i }).click();
  await page.getByRole("button", { name: "Open Runtime" }).click();

  await expect(page).toHaveURL(/\/application\/application-95a8/);
  await expect(page.getByText("SandboxV0.0")).toBeVisible();
});
