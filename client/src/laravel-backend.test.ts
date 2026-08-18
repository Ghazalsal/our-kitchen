import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = "/home/ubuntu/our-kitchen";
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

describe("Laravel commerce backend", () => {
  it("registers the persistent customer, admin, and media API routes", () => {
    const routes = read("laravel/routes/api.php");
    expect(routes).toContain("/store/bootstrap");
    expect(routes).toContain("/admin/unlock");
    expect(routes).toContain("/orders");
    expect(routes).toContain("/media");
  });

  it("protects administrative mutations and persists product media metadata", () => {
    const controller = read("laravel/app/Http/Controllers/StoreApiController.php");
    expect(controller).toContain("requireAdmin");
    expect(controller).toContain("kitchen_media_files");
    expect(controller).toContain("v1/storage/presign/put");
  });

  it("uses the TiDB-safe commerce tables in the Laravel migration", () => {
    const migration = read("laravel/database/migrations/2026_08_18_000003_create_copperline_store_tables.php");
    expect(migration).toContain("cartLines");
    expect(migration).toContain("kitchen_products");
    expect(migration).toContain("kitchen_orders");
  });
});
