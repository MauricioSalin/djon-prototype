import { expect, test } from "@playwright/test";
import { store } from "../lib/store";

const originalFetch = globalThis.fetch;
const record = { id: "507f1f77bcf86cd799439001", name: "Nome antigo", role: "student", email: "race@example.test" };

test.beforeEach(() => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
    removeItem: (key: string) => { entries.delete(key); },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(new EventTarget(), { location: { hostname: "localhost" } }) });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
  store.logout();
  localStorage.setItem("djon_access_token", "account-a");
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "sessionStorage");
});

test("a GET started before a PATCH cannot overwrite the saved record", async () => {
  let current = { ...record };
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let reads = 0;
  globalThis.fetch = async (_input, options) => {
    if (options?.method === "PATCH") {
      current = { ...current, ...JSON.parse(String(options.body)) };
      return Response.json(current);
    }
    reads += 1;
    const snapshot = { ...current };
    if (reads === 1) await gate;
    return Response.json(snapshot);
  };
  const reading = store.fetchUserById(record.id);
  await expect.poll(() => reads).toBe(1);
  await store.updateUser(record.id, { name: "Nome salvo" });
  release();
  expect((await reading)?.name).toBe("Nome salvo");
  expect(store.getUserById(record.id)?.name).toBe("Nome salvo");
  expect(reads).toBe(2);
});

test("a late 401 from another account cannot clear the current login", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let started = false;
  globalThis.fetch = async () => {
    started = true;
    await gate;
    return Response.json({ message: "Expired" }, { status: 401 });
  };
  const reading = store.fetchUserById(record.id);
  const rejected = expect(reading).rejects.toMatchObject({ status: 409 });
  await expect.poll(() => started).toBe(true);
  localStorage.setItem("djon_access_token", "account-b");
  release();
  await rejected;
  expect(localStorage.getItem("djon_access_token")).toBe("account-b");
  expect(store.getUsers()).toEqual([]);
});

test("pagination restarts when a write occurs between pages", async () => {
  let current = { ...record };
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let secondPageStarted = false;
  let firstPages = 0;
  globalThis.fetch = async (input, options) => {
    if (options?.method === "PATCH") {
      current = { ...current, ...JSON.parse(String(options.body)) };
      return Response.json(current);
    }
    const page = Number(new URL(String(input)).searchParams.get("page"));
    if (page === 1) firstPages += 1;
    if (page === 2 && !secondPageStarted) {
      secondPageStarted = true;
      await gate;
    }
    return Response.json({ items: page === 1 ? [current] : [{ ...record, id: "507f1f77bcf86cd799439002" }], total: 2, page, limit: 1 });
  };
  const reading = store.listAdminUsers();
  await expect.poll(() => secondPageStarted).toBe(true);
  await store.updateUser(record.id, { name: "Nome atualizado entre paginas" });
  release();
  expect((await reading).find((item) => item.id === record.id)?.name).toBe("Nome atualizado entre paginas");
  expect(firstPages).toBe(2);
});
