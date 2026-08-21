import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = "/home/ubuntu/our-kitchen";
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

describe("Laravel commerce backend", () => {
  it("registers the persistent customer, session-auth, admin, and media API routes", () => {
    const routes = read("laravel/routes/api.php");
    expect(routes).toContain("/store/bootstrap");
    expect(routes).toContain("prefix('auth')");
    expect(routes).toContain("Route::post('/register'");
    expect(routes).toContain("Route::post('/login'");
    expect(routes).toContain("Route::post('/password/reset'");
    expect(routes).toContain("/orders");
    expect(routes).toContain("/media");
    expect(routes).toContain("middleware('web')");
  });

  it("keeps customer order verification configurable while protecting administrator mutations", () => {
    const controller = read("laravel/app/Http/Controllers/StoreApiController.php");
    const kitchen = read("laravel/config/kitchen.php");
    const store = read("client/src/contexts/StoreContext.tsx");
    const checkout = read("client/src/pages/Checkout.tsx");
    expect(controller).toContain("requireAdmin");
    expect(controller).toContain("requireVerifiedUser");
    expect(controller).toContain("config('kitchen.require_email_verification')");
    expect(controller).toContain("DB::transaction(function () use ($order, $user)");
    expect(kitchen).toContain("KITCHEN_REQUIRE_EMAIL_VERIFICATION");
    expect(kitchen).toContain("env('KITCHEN_REQUIRE_EMAIL_VERIFICATION', false)");
    expect(controller).toContain("hasVerifiedEmail()");
    expect(store).toContain('await laravelRequest<Order>("/orders", "POST", { order })');
    expect(store).toContain("orders: [confirmed");
    expect(checkout).toContain("Your cart has been kept intact");
    expect(controller).toContain("kitchen_media_files");
    expect(controller).toContain("v1/storage/presign/put");
  });

  it("uses rate-limited secure account endpoints with database-backed cache support", () => {
    const auth = read("laravel/app/Http/Controllers/AuthController.php");
    const cacheMigration = read("laravel/database/migrations/0001_01_01_000001_create_cache_table.php");
    expect(auth).toContain("RateLimiter::tooManyAttempts");
    expect(auth).toContain("Hash::make");
    expect(auth).toContain("Password::sendResetLink");
    expect(auth).toContain("email:rfc");
    expect(cacheMigration).toContain("Schema::create('cache'");
    expect(cacheMigration).toContain("Schema::create('cache_locks'");
  });

  it("provides a confirmation-gated operational path for admin promotion", () => {
    const command = read("laravel/app/Console/Commands/PromoteKitchenAdmin.php");
    const operations = read("ADMIN_OPERATIONS.md");
    expect(command).toContain("kitchen:promote-admin");
    expect(command).toContain("$this->confirm");
    expect(command).toContain("role' => 'admin'");
    expect(operations).toContain("MAIL_FROM_ADDRESS");
  });

  it("keeps administrator sign-in distinct from customer account routes", () => {
    const app = read("client/src/App.tsx");
    const account = read("client/src/pages/Account.tsx");
    const admin = read("client/src/pages/Admin.tsx");
    expect(app).toContain('path={"/admin/login"}');
    expect(account).toContain("Administrator sign in.");
    expect(account).toContain("signedIn.role !== \"admin\"");
    expect(admin).toContain('href="/admin/login"');
  });

  it("adds accessible password visibility controls to every account password form", () => {
    const account = read("client/src/pages/Account.tsx");
    expect(account).toContain("function PasswordInput");
    expect(account).toContain('aria-label={visible ? "Hide password" : "Show password"}');
    expect(account).toContain('type={visible ? "text" : "password"}');
    expect(account).toContain('<button type="button"');
    expect(account).toContain("setVisible((current) => !current)");
    expect(account).toContain("<EyeOff");
    expect(account.match(/<PasswordInput/g)?.length).toBe(6);
  });

  it("refreshes and retries one stale CSRF token without weakening mutation protection", () => {
    const auth = read("client/src/contexts/AuthContext.tsx");
    const controller = read("laravel/app/Http/Controllers/AuthController.php");
    expect(auth).toContain('fetch("/api/auth/csrf"');
    expect(auth).toContain('cache: "no-store"');
    expect(auth).toContain("response.status === 419");
    expect(auth).toContain("await refreshCsrf(); response = await send();");
    expect(auth).toContain('headers["X-CSRF-TOKEN"] = token');
    expect(auth).toContain("let sessionCsrfToken");
    expect(controller).toContain("$request->session()->regenerateToken()");
    expect(controller).toContain("'token' => $request->session()->token()");
  });

  it("defaults new visitors to Arabic while preserving an explicit language choice", () => {
    const language = read("client/src/contexts/LanguageContext.tsx");
    const translations = read("client/src/lib/i18n.ts");
    expect(language).toContain('const LANGUAGE_PREFERENCE_KEY = "our-kitchen-language-preference"');
    expect(language).toContain('preference === "ar" || preference === "en" ? preference : "ar"');
    expect(language).toContain("saveLanguagePreference(localStorage, next)");
    expect(translations).toContain('"Administrator sign in.": "تسجيل دخول المدير."');
    expect(translations).toContain('"Open atelier desk": "افتح مكتب الورشة"');
  });

  it("documents an external, responsive image optimization pipeline for large catalogs", () => {
    const pipeline = read("IMAGE_OPTIMIZATION_PIPELINE.md");
    expect(pipeline).toContain("Managed S3/object storage");
    expect(pipeline).toContain("WebP/AVIF");
    expect(pipeline).toContain("srcset");
    expect(pipeline).toContain("Never store user image bytes directly in TiDB");
  });

  it("seeds Dorsha kitchenware categories and features the maker on the customer homepage", () => {
    const seed = read("client/src/lib/seed.ts");
    const home = read("client/src/pages/Home.tsx");
    const translations = read("client/src/lib/i18n.ts");
    expect(seed).toContain('brand: "Dorsha"');
    expect(seed).toContain('id: "dorsha-cups"');
    expect(seed).toContain('id: "dorsha-plates"');
    expect(seed).toContain('id: "dorsha-cutlery"');
    expect(seed).toContain('id: "dorsha-serve"');
    expect(home).toContain('product.brand === "Dorsha"');
    expect(home).toContain("Shop Dorsha tableware");
    expect(translations).toContain('"Cups & mugs": "أكواب ومجّات"');
  });

  it("preserves a homepage category link in the shop filter", () => {
    const shop = read("client/src/pages/Shop.tsx");
    expect(shop).toContain('new URLSearchParams(window.location.search).get("category")');
    expect(shop).toContain("[location]");
    expect(shop).toContain("setCategory");
  });

  it("keeps reset email and token together through the storefront redirect", () => {
    const routes = read("laravel/routes/web.php");
    const account = read("client/src/pages/Account.tsx");
    expect(routes).toContain("request('email')");
    expect(account).toContain('query.get("email")');
  });

  it("uses the TiDB-safe commerce tables in the Laravel migration", () => {
    const migration = read("laravel/database/migrations/2026_08_18_000003_create_copperline_store_tables.php");
    expect(migration).toContain("cartLines");
    expect(migration).toContain("kitchen_products");
    expect(migration).toContain("kitchen_orders");
  });

  it("serves an installable multi-size web-app manifest", () => {
    const manifest = read("client/public/manifest.webmanifest");
    const routes = read("laravel/routes/web.php");
    expect(manifest).toContain("our-kitchen-icon-192");
    expect(manifest).toContain("our-kitchen-icon-512");
    expect(manifest).toContain('"display": "standalone"');
    expect(routes).toContain("/manifest.webmanifest");
  });

  it("uses the ILS formatter across customer and admin money surfaces", () => {
    const files = [
      "client/src/pages/Cart.tsx",
      "client/src/pages/Checkout.tsx",
      "client/src/pages/Track.tsx",
      "client/src/pages/Admin.tsx",
      "client/src/components/ProductCard.tsx",
    ];
    files.forEach((path) => {
      const source = read(path);
      expect(source).toContain("formatILS");
      expect(source).not.toMatch(/\$[0-9]/);
    });
  });

  it("keeps transactional email credentials in environment-backed Laravel configuration", () => {
    const mail = read("laravel/config/mail.php");
    expect(mail).toContain("env('MAIL_MAILER'");
    expect(mail).toContain("env('MAIL_HOST'");
    expect(mail).toContain("env('MAIL_USERNAME'");
    expect(mail).toContain("env('MAIL_PASSWORD'");
    expect(mail).toContain("env('MAIL_FROM_ADDRESS'");
  });

  it("keeps the signed verification flow available but disables it by default until mail delivery is connected", () => {
    const auth = read("laravel/app/Http/Controllers/AuthController.php");
    const account = read("client/src/pages/Account.tsx");
    const rollout = read("EMAIL_VERIFICATION_ROLLOUT.md");
    expect(auth).toContain("if ($emailVerificationRequired) event(new Registered($user))");
    expect(auth).toContain("emailVerificationRequired");
    expect(account).toContain("user.emailVerificationRequired && !user.emailVerified");
    expect(rollout).toContain("KITCHEN_REQUIRE_EMAIL_VERIFICATION=true");
  });

  it("adds time-aware scoped campaigns with protected management, countdown, and server-side discount rules", () => {
    const migration = read("laravel/database/migrations/2026_08_21_000005_create_kitchen_campaigns_table.php");
    const routes = read("laravel/routes/api.php");
    const controller = read("laravel/app/Http/Controllers/StoreApiController.php");
    const context = read("client/src/contexts/StoreContext.tsx");
    const campaigns = read("client/src/pages/Campaigns.tsx");
    const home = read("client/src/pages/Home.tsx");
    const checkout = read("client/src/pages/Checkout.tsx");
    expect(migration).toContain("kitchen_campaigns");
    expect(migration).toContain("targetType");
    expect(migration).toContain("startsAt");
    expect(migration).toContain("endsAt");
    expect(routes).toContain("/campaigns/{id}");
    expect(controller).toContain("requireAdmin($request)");
    expect(controller).toContain("campaignDiscount");
    expect(controller).toContain("where('startsAt', '<=', now())");
    expect(controller).toContain("targetType === 'brand'");
    expect(context).toContain("campaignResult");
    expect(context).toContain("/campaigns/${campaign.id}");
    expect(context).toContain("upsertCampaign: async");
    expect(context).toContain("await laravelRequest<Campaign>");
    expect(context).toContain("deleteCampaign: async");
    expect(campaigns).toContain("Campaign applies to");
    expect(campaigns).toContain("Create campaign");
    expect(home).toContain("CampaignCountdown");
    expect(home).toContain("starts in");
    expect(home).toContain("available.filter((campaign) => new Date(campaign.startsAt).getTime() <= now)");
    expect(checkout).toContain("campaign.campaign.name");
    expect(checkout).not.toContain("if (!user.emailVerified)");
  });

  it("polls only authenticated, role-scoped persisted activity every 30 seconds", () => {
    const routes = read("laravel/routes/api.php");
    const controller = read("laravel/app/Http/Controllers/StoreApiController.php");
    const store = read("client/src/contexts/StoreContext.tsx");
    expect(routes).toContain("/store/activity");
    expect(controller).toContain("public function activity(Request $request)");
    expect(controller).toContain("$this->activityState($this->requireUser($request))");
    expect(controller).toContain("where('user_id', $user->id)");
    expect(store).toContain("const NOTIFICATION_POLLING_INTERVAL_MS = 30_000");
    expect(store).toContain('api<StoreActivity>("/store/activity")');
    expect(store).toContain('document.visibilityState === "hidden"');
    expect(store).toContain("window.setInterval(() => { void refreshActivity(); }, NOTIFICATION_POLLING_INTERVAL_MS)");
    expect(store).toContain("window.clearInterval(interval)");
    expect(store).toContain("document.removeEventListener(\"visibilitychange\", refreshOnReturn)");
  });
});
