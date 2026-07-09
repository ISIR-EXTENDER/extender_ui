import { describe, expect, it } from "vitest";

import { selectNextTabletMode } from "./teleopStore";

describe("teleopStore", () => {
  it("cycles tablet controls through combined modes only", () => {
    expect(selectNextTabletMode(0)).toBe(3);
    expect(selectNextTabletMode(3)).toBe(0);
    expect(selectNextTabletMode(4)).toBe(3);
  });

  it("recovers legacy rotation-only and translation-only modes to BOTH", () => {
    expect(selectNextTabletMode(1)).toBe(3);
    expect(selectNextTabletMode(2)).toBe(3);
  });
});
