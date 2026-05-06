import { describe, expect, it } from "vitest";

import {
  addMonths,
  formatMonth,
  getArrivalMonth,
  getStatus,
  type RollforwardEntry,
  type RollforwardResult,
  suggestPO,
} from "@/lib/calculations";

const createEntry = (
  month: string,
  balance: number,
  overrides: Partial<RollforwardEntry> = {}
): RollforwardEntry => ({
  month,
  currentStock: 0,
  incomingPOUnits: 0,
  forecastUnits: 0,
  balance,
  status: getStatus(balance, 100),
  ...overrides,
});

const createRollforward = (
  entries: RollforwardEntry[],
  overrides: Partial<RollforwardResult> = {}
): RollforwardResult => ({
  productId: 10,
  productName: "Sodium Chloride",
  sku: "NA-CL-001",
  packingPerPallet: 100,
  currentStock: 500,
  exwPriceEur: 12,
  entries,
  ...overrides,
});

describe("getStatus", () => {
  const packing = 100;

  it("returns stockout for negative balances", () => {
    expect(getStatus(-1, packing)).toBe("stockout");
    expect(getStatus(-100, packing)).toBe("stockout");
  });

  it("returns critical below one pallet", () => {
    expect(getStatus(0, packing)).toBe("critical");
    expect(getStatus(50, packing)).toBe("critical");
    expect(getStatus(99, packing)).toBe("critical");
  });

  it("returns low from one pallet up to below three pallets", () => {
    expect(getStatus(100, packing)).toBe("low");
    expect(getStatus(200, packing)).toBe("low");
    expect(getStatus(299, packing)).toBe("low");
  });

  it("returns ok at three pallets and above", () => {
    expect(getStatus(300, packing)).toBe("ok");
    expect(getStatus(1_000, packing)).toBe("ok");
  });
});

describe("addMonths", () => {
  it("adds months within the same year", () => {
    expect(addMonths("2026-01", 3)).toBe("2026-04");
    expect(addMonths("2026-06", 2)).toBe("2026-08");
  });

  it("rolls forward across year boundaries", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("handles multi-year spans", () => {
    expect(addMonths("2026-01", 12)).toBe("2027-01");
    expect(addMonths("2026-01", 24)).toBe("2028-01");
  });

  it("returns the same month when count is zero", () => {
    expect(addMonths("2026-05", 0)).toBe("2026-05");
  });

  it("subtracts months across year boundaries", () => {
    expect(addMonths("2026-05", -2)).toBe("2026-03");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("formatMonth", () => {
  it("formats individual months for display", () => {
    expect(formatMonth("2026-01")).toBe("Jan 2026");
    expect(formatMonth("2026-06")).toBe("Jun 2026");
    expect(formatMonth("2026-12")).toBe("Dec 2026");
  });

  it("formats all calendar months", () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    monthNames.forEach((monthName, index) => {
      const month = String(index + 1).padStart(2, "0");
      expect(formatMonth(`2026-${month}`)).toBe(`${monthName} 2026`);
    });
  });
});

describe("getArrivalMonth", () => {
  it("adds the five-month purchase order lead time", () => {
    expect(getArrivalMonth("2026-01")).toBe("2026-06");
    expect(getArrivalMonth("2026-06")).toBe("2026-11");
  });

  it("rolls arrival months into the next year", () => {
    expect(getArrivalMonth("2026-09")).toBe("2027-02");
    expect(getArrivalMonth("2026-12")).toBe("2027-05");
  });
});

describe("suggestPO", () => {
  it("returns null when the horizon has no stockout", () => {
    const rollforward = createRollforward([
      createEntry("2026-05", 500),
      createEntry("2026-06", 300),
    ]);

    expect(suggestPO(rollforward, "2026-05")).toBeNull();
  });

  it("uses the first stockout to calculate shortfall, pallets, and value", () => {
    const rollforward = createRollforward([
      createEntry("2026-05", 50),
      createEntry("2026-06", -250),
      createEntry("2026-07", -800),
    ]);

    expect(suggestPO(rollforward, "2026-05")).toMatchObject({
      productId: 10,
      productName: "Sodium Chloride",
      sku: "NA-CL-001",
      firstStockoutMonth: "2026-06",
      shortfallUnits: 250,
      palletsNeeded: 3,
      containerConfig: 22,
      poValueEur: 3_600,
      urgency: "critical",
    });
  });

  it("rounds up partial pallet shortfalls", () => {
    const rollforward = createRollforward([createEntry("2026-07", -101)]);

    expect(suggestPO(rollforward, "2026-05")?.palletsNeeded).toBe(2);
  });

  it("selects a 22-pallet container for up to 22 pallets", () => {
    const rollforward = createRollforward([createEntry("2026-08", -2_200)]);

    expect(suggestPO(rollforward, "2026-05")?.containerConfig).toBe(22);
  });

  it("selects a 44-pallet container for 23 to 44 pallets", () => {
    const rollforward = createRollforward([createEntry("2026-08", -2_201)]);

    expect(suggestPO(rollforward, "2026-05")?.containerConfig).toBe(44);
  });

  it("selects mixed containers above 44 pallets", () => {
    const rollforward = createRollforward([createEntry("2026-08", -4_401)]);

    expect(suggestPO(rollforward, "2026-05")?.containerConfig).toBe("mixed");
  });

  it("marks stockouts within two months as critical", () => {
    const rollforward = createRollforward([createEntry("2026-07", -100)]);

    expect(suggestPO(rollforward, "2026-05")?.urgency).toBe("critical");
  });

  it("marks later stockouts as warning", () => {
    const rollforward = createRollforward([createEntry("2026-08", -100)]);

    expect(suggestPO(rollforward, "2026-05")?.urgency).toBe("warning");
  });
});
