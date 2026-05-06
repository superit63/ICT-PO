import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins string class names", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
  });

  it("omits falsy values", () => {
    expect(cn("block", false && "hidden", null, undefined, "")).toBe("block");
  });

  it("supports clsx object and array syntax", () => {
    expect(cn(["rounded", "border"], { "bg-primary": true, hidden: false })).toBe(
      "rounded border bg-primary"
    );
  });

  it("merges conflicting Tailwind utilities with the latest value", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("preserves custom non-conflicting classes", () => {
    expect(cn("custom-card", "text-sm", "font-medium")).toBe(
      "custom-card text-sm font-medium"
    );
  });
});
