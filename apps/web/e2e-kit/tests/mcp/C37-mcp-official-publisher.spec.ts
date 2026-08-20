// @caseId C37-mcp-official-publisher
// @spec apps/web/e2e-kit/case-specs/mcp/C37-mcp-official-publisher.md

import { test, expect } from "../../fixtures-authed";
const REDACTED_CREATOR = "[redacted-admin]";

test("@C37 @p1 @mcp @mcp-official official publisher renders in MCP market", async ({
  authedPage,
}) => {
  await authedPage.addInitScript(() => {
    sessionStorage.setItem("__e2e_scenario", "mcp-official");
  });
  await authedPage.goto("/mcp-market/mcp?sid=e2etest");

  const officialCard = authedPage.getByRole("button", {
    name: /Official Search MCP/,
  });
  const normalCard = authedPage.getByRole("button", {
    name: /Community Search MCP/,
  });
  await expect(officialCard).toBeVisible();
  await expect(normalCard).toBeVisible();
  await expect(officialCard).toContainText("官方发布");
  await expect(officialCard).not.toContainText(REDACTED_CREATOR);
  await expect(normalCard).toContainText("Alice");

  await officialCard.click();
  const detailModal = authedPage.getByRole("dialog");
  await expect(detailModal).toBeVisible();
  await expect(detailModal).toContainText("Official Search MCP");
  await expect(detailModal).toContainText("官方发布");
  await expect(detailModal).not.toContainText(REDACTED_CREATOR);

  await authedPage.getByRole("button", { name: "关闭" }).click();
  await expect(detailModal).not.toBeVisible();

  await normalCard.click();
  await expect(detailModal).toBeVisible();
  await expect(detailModal).toContainText("Community Search MCP");
  await expect(detailModal).toContainText("Alice");
  await expect(detailModal).not.toContainText("官方发布");
  await authedPage.getByRole("button", { name: "关闭" }).click();
  await expect(detailModal).not.toBeVisible();
});
