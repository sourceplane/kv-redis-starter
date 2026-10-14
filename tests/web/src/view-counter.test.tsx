import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// The counter is the template's one piece of logic: Redis INCR became a
// read-modify-write on the VIEWS KV namespace.
const store = new Map<string, string>();
const kv = {
  get: vi.fn(async (key: string) => store.get(key) ?? null),
  put: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: { VIEWS: kv } }),
}));

describe("ViewCounter (components/view-counter.tsx)", () => {
  beforeEach(() => {
    store.clear();
    kv.get.mockClear();
    kv.put.mockClear();
  });

  it("starts at one when the namespace is empty and stores the new count", async () => {
    const { default: ViewCounter } = await import("@/components/view-counter");
    const html = renderToStaticMarkup(await ViewCounter());
    expect(html).toContain("1 views");
    expect(kv.put).toHaveBeenCalledWith("views", "1");
  });

  it("increments the stored count and formats it", async () => {
    store.set("views", "1233");
    const { default: ViewCounter } = await import("@/components/view-counter");
    const html = renderToStaticMarkup(await ViewCounter());
    expect(html).toContain("1,234 views");
    expect(store.get("views")).toBe("1234");
  });
});
