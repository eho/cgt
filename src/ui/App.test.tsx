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

  it("lets a user add a property and edit its details from the portfolio screen", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<App />);
    });

    const propertyButton = Array.from(host.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Property");
    expect(propertyButton).toBeTruthy();

    await act(async () => {
      propertyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(host.textContent).toContain("Asset details");
    expect(host.textContent).toContain("Purchase price");
    expect(host.textContent).toContain("Loan balance");
    expect(host.textContent).toContain("Expected sale price");

    const nameInput = Array.from(host.querySelectorAll("input")).find((input) => input.value === "New investment property");
    expect(nameInput).toBeTruthy();

    await act(async () => {
      setInputValue(nameInput!, "My rental property");
      nameInput?.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(host.textContent).toContain("My rental property");
  });

  it("calculates share parcel current value from units and current unit price", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<App />);
    });

    const shareButton = Array.from(host.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Share parcel");
    expect(shareButton).toBeTruthy();

    await act(async () => {
      shareButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(host.textContent).toContain("Parcel cost base");
    expect(host.textContent).toContain("Current unit price");
    expect(host.textContent).toContain("Units x Current unit price");
    expect(host.textContent).toContain("$65,000");
  });
});

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
}
