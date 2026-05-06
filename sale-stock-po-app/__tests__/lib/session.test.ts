import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryOne } from "@/lib/db";
import {
  getPinHashRecord,
  hasValidRequestSession,
  hasValidSessionValue,
} from "@/lib/session";

vi.mock("@/lib/db", () => ({
  queryOne: vi.fn(),
}));

const mockedQueryOne = vi.mocked(queryOne);

describe("session utilities", () => {
  beforeEach(() => {
    mockedQueryOne.mockReset();
  });

  describe("getPinHashRecord", () => {
    it("loads the configured PIN hash record", async () => {
      mockedQueryOne.mockResolvedValue({ value: "stored-hash" });

      await expect(getPinHashRecord()).resolves.toEqual({ value: "stored-hash" });
      expect(mockedQueryOne).toHaveBeenCalledWith(
        "SELECT value FROM app_config WHERE key = 'pin_hash'"
      );
    });

    it("returns null when no PIN hash is configured", async () => {
      mockedQueryOne.mockResolvedValue(null);

      await expect(getPinHashRecord()).resolves.toBeNull();
    });
  });

  describe("hasValidSessionValue", () => {
    it("rejects missing session values without querying the database", async () => {
      await expect(hasValidSessionValue()).resolves.toBe(false);
      await expect(hasValidSessionValue(null)).resolves.toBe(false);
      await expect(hasValidSessionValue("")).resolves.toBe(false);

      expect(mockedQueryOne).not.toHaveBeenCalled();
    });

    it("accepts a session value that exactly matches the stored hash", async () => {
      mockedQueryOne.mockResolvedValue({ value: "stored-hash" });

      await expect(hasValidSessionValue("stored-hash")).resolves.toBe(true);
    });

    it("rejects a session value that differs from the stored hash", async () => {
      mockedQueryOne.mockResolvedValue({ value: "stored-hash" });

      await expect(hasValidSessionValue("different-hash")).resolves.toBe(false);
    });

    it("rejects a session value when no stored hash exists", async () => {
      mockedQueryOne.mockResolvedValue(null);

      await expect(hasValidSessionValue("stored-hash")).resolves.toBe(false);
    });

    it("compares strings directly rather than validating a raw PIN", async () => {
      mockedQueryOne.mockResolvedValue({ value: "$2b$10$stored-pin-hash" });

      await expect(hasValidSessionValue("123456")).resolves.toBe(false);
    });
  });

  describe("hasValidRequestSession", () => {
    it("reads the session_pin cookie and validates its value", async () => {
      const getCookie = vi.fn().mockReturnValue({ value: "stored-hash" });
      mockedQueryOne.mockResolvedValue({ value: "stored-hash" });

      const result = await hasValidRequestSession({
        cookies: { get: getCookie },
      } as never);

      expect(result).toBe(true);
      expect(getCookie).toHaveBeenCalledWith("session_pin");
    });

    it("rejects requests without a session_pin cookie", async () => {
      const getCookie = vi.fn().mockReturnValue(undefined);

      const result = await hasValidRequestSession({
        cookies: { get: getCookie },
      } as never);

      expect(result).toBe(false);
      expect(mockedQueryOne).not.toHaveBeenCalled();
    });
  });
});
