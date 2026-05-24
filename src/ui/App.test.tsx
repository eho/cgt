import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the portfolio workspace and navigates to compare scenarios", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<App />);
    });

    expect(host.textContent).toContain("Portfolio workspace");
    expect(host.textContent).toContain("Richmond townhouse");
    expect(host.textContent).toContain("Grandfathered property");

    const compareButton = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Compare");
    expect(compareButton).toBeTruthy();

    await act(async () => {
      compareButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(host.textContent).toContain("Scenario comparison");
    expect(host.textContent).toContain("Before reform");
    expect(host.textContent).toContain("High CPI");
  });
});
