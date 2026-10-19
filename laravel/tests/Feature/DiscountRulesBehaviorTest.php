<?php

namespace Tests\Feature;

use App\Http\Controllers\StoreApiController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

/** Server totals must match client/src/lib/pricing.test.ts so the checkout never shows one price and charges another. */
class DiscountRulesBehaviorTest extends TestCase
{
    private const PRODUCTS = ['discount-test-quilt', 'discount-test-mug', 'discount-test-pillow'];
    private const COUPONS = ['discount-test-coupon'];
    private const CAMPAIGNS = ['discount-test-campaign'];
    private const EMAILS = ['discount-test-admin@example.com', 'discount-test-customer@example.com'];
    private int $orderCount = 0;

    public function test_server_applies_campaigns_and_coupons_like_the_storefront(): void
    {
        $this->cleanUp();
        try {
            $admin = User::create(['name' => 'Discount Admin', 'email' => self::EMAILS[0], 'password' => Hash::make('DiscountTestPass123'), 'role' => 'admin']);
            $customer = User::create(['name' => 'Discount Customer', 'email' => self::EMAILS[1], 'password' => Hash::make('DiscountTestPass123'), 'role' => 'customer']);
            $this->product('discount-test-quilt', 300, 'discount-bedding', 'Villa');
            $this->product('discount-test-mug', 50, 'discount-kitchen', 'Dorsha');
            $this->product('discount-test-pillow', 100, 'discount-bedding', 'Villa');

            // Coupon applies after the campaign: 45% off 300 leaves 165, 10% coupon takes 16.50.
            $this->campaign($admin, ['type' => 'percent', 'value' => 45, 'targetType' => 'products', 'targetValues' => ['discount-test-quilt']]);
            $this->coupon($admin, ['type' => 'percent', 'value' => 10]);
            $order = $this->order($customer, [['discount-test-quilt', 1]], 'DISCOUNTTEST');
            $this->assertEquals([300, 151.5, 18, 166.5], [$order['subtotal'], $order['discount'], $order['shipping'], $order['total']]);

            // A product-targeted campaign leaves other products alone.
            $order = $this->order($customer, [['discount-test-mug', 1]]);
            $this->assertNull($order['campaignId']);
            $this->assertEquals(0, $order['discount']);
            DB::table('kitchen_campaigns')->whereIn('id', self::CAMPAIGNS)->delete();

            // A product coupon discounts only that product and does not block the rest of the bag.
            $this->coupon($admin, ['type' => 'percent', 'value' => 50, 'productIds' => ['discount-test-mug']]);
            $order = $this->order($customer, [['discount-test-pillow', 1], ['discount-test-mug', 2]], 'DISCOUNTTEST');
            $this->assertEquals('DISCOUNTTEST', $order['couponCode']);
            $this->assertEquals(50, $order['discount']);
            $order = $this->order($customer, [['discount-test-pillow', 1]], 'DISCOUNTTEST');
            $this->assertNull($order['couponCode']);
            $this->assertEquals(0, $order['discount']);

            // A fixed campaign is shared by value: the mug carries 10 of 30, so a 50% mug coupon takes 20.
            $this->campaign($admin, ['type' => 'fixed', 'value' => 30, 'targetType' => 'all', 'targetValues' => []]);
            $order = $this->order($customer, [['discount-test-pillow', 1], ['discount-test-mug', 1]], 'DISCOUNTTEST');
            $this->assertEquals(50, $order['discount']);
            DB::table('kitchen_campaigns')->whereIn('id', self::CAMPAIGNS)->delete();

            // Fixed coupon is capped at the items it covers; free delivery waives the fee.
            $this->coupon($admin, ['type' => 'fixed', 'value' => 500]);
            $order = $this->order($customer, [['discount-test-mug', 1]], 'DISCOUNTTEST');
            $this->assertEquals([50, 18, 18], [$order['discount'], $order['shipping'], $order['total']]);
            $this->coupon($admin, ['type' => 'free_shipping', 'value' => 0]);
            $order = $this->order($customer, [['discount-test-mug', 1]], 'DISCOUNTTEST');
            $this->assertEquals([0, 0, 50], [$order['discount'], $order['shipping'], $order['total']]);

            // A code works for the whole of its expiry day and not after.
            $this->coupon($admin, ['type' => 'percent', 'value' => 10, 'expiresAt' => now()->toDateString()]);
            $this->assertEquals(5, $this->order($customer, [['discount-test-mug', 1]], 'DISCOUNTTEST')['discount']);
            $this->coupon($admin, ['type' => 'percent', 'value' => 10, 'expiresAt' => now()->subDay()->toDateString()]);
            $this->assertEquals(0, $this->order($customer, [['discount-test-mug', 1]], 'DISCOUNTTEST')['discount']);

            // Percent offers above 100% are refused.
            try {
                $this->coupon($admin, ['type' => 'percent', 'value' => 150]);
                $this->fail('A 150% coupon should be rejected.');
            } catch (HttpException $exception) {
                $this->assertSame(422, $exception->getStatusCode());
            }
        } finally {
            $this->cleanUp();
        }
    }

    private function product(string $id, float $price, string $categoryId, string $brand): void
    {
        DB::table('kitchen_products')->insert(['id' => $id, 'name' => $id, 'brand' => $brand, 'price' => $price, 'compareAt' => null, 'categoryId' => $categoryId, 'image' => '', 'gallery' => '[]', 'description' => '', 'features' => '[]', 'stock' => 10, 'colors' => '["Oat"]', 'sizes' => '[]', 'variantImages' => '[]', 'featured' => false, 'deal' => false, 'published' => true, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function coupon(User $admin, array $data): void
    {
        $request = Request::create('/api/coupons/'.self::COUPONS[0], 'PUT', ['code' => 'DISCOUNTTEST', 'minSpend' => 0, 'expiresAt' => now()->addMonth()->toDateString(), 'active' => true, 'categoryIds' => [], 'productIds' => [], ...$data]);
        $request->setUserResolver(static fn () => $admin);
        app(StoreApiController::class)->saveCoupon($request, self::COUPONS[0]);
    }

    private function campaign(User $admin, array $data): void
    {
        $request = Request::create('/api/campaigns/'.self::CAMPAIGNS[0], 'PUT', ['name' => 'Discount test', 'minSpend' => 0, 'startsAt' => now()->subMinute()->toDateTimeString(), 'endsAt' => now()->addHour()->toDateTimeString(), 'enabled' => true, 'priority' => 1000, ...$data]);
        $request->setUserResolver(static fn () => $admin);
        app(StoreApiController::class)->saveCampaign($request, self::CAMPAIGNS[0]);
    }

    private function order(User $customer, array $lines, ?string $couponCode = null): array
    {
        $id = 'CK-DISCOUNT-'.(++$this->orderCount);
        $request = Request::create('/api/orders', 'POST', ['order' => ['id' => $id, 'address' => 'Discount test address', 'couponCode' => $couponCode, 'lines' => array_map(fn (array $line) => ['productId' => $line[0], 'color' => 'Oat', 'quantity' => $line[1]], $lines)]]);
        $request->setUserResolver(static fn () => $customer);
        return app(StoreApiController::class)->createOrder($request)->getData(true);
    }

    private function cleanUp(): void
    {
        $orderIds = DB::table('kitchen_orders')->where('id', 'like', 'CK-DISCOUNT-%')->pluck('id');
        DB::table('kitchen_order_lines')->whereIn('orderId', $orderIds)->delete();
        DB::table('kitchen_notifications')->whereIn('orderId', $orderIds)->delete();
        DB::table('kitchen_orders')->whereIn('id', $orderIds)->delete();
        DB::table('kitchen_coupons')->whereIn('id', self::COUPONS)->delete();
        DB::table('kitchen_campaigns')->whereIn('id', self::CAMPAIGNS)->delete();
        DB::table('kitchen_products')->whereIn('id', self::PRODUCTS)->delete();
        DB::table('sessions')->whereIn('user_id', DB::table('users')->whereIn('email', self::EMAILS)->pluck('id'))->delete();
        DB::table('users')->whereIn('email', self::EMAILS)->delete();
    }
}
