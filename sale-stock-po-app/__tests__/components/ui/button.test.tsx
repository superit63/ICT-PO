import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders accessible button text", () => {
    render(<Button>Save changes</Button>);

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("applies default variant and size classes", () => {
    render(<Button>Default</Button>);

    const button = screen.getByRole("button", { name: "Default" });
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
    expect(button).toHaveClass("h-10");
  });

  it("applies requested variant, size, and custom classes", () => {
    render(
      <Button className="tracking-wide" size="sm" variant="outline">
        Outlined
      </Button>
    );

    const button = screen.getByRole("button", { name: "Outlined" });
    expect(button).toHaveClass("border-border");
    expect(button).toHaveClass("h-8");
    expect(button).toHaveClass("tracking-wide");
  });

  it("supports icon-only sizing with an accessible label", () => {
    render(
      <Button aria-label="Refresh" size="icon" variant="ghost">
        ↻
      </Button>
    );

    const button = screen.getByRole("button", { name: "Refresh" });
    expect(button).toHaveClass("size-10");
    expect(button).toHaveClass("hover:bg-muted/80");
  });

  it("passes disabled state through to the primitive", () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("handles click interactions", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Submit
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass("bg-destructive/10");
    expect(button).toHaveClass("text-destructive");
  });
});
