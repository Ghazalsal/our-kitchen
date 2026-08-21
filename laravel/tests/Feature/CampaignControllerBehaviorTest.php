<?php

namespace Tests\Feature;

use App\Http\Controllers\StoreApiController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class CampaignControllerBehaviorTest extends TestCase
{
    public function test_campaigns_require_admin_and_server_calculates_live_scoped_discount(): void
    {
        $campaignIds = ['campaign-feature-live', 'campaign-feature-future'];
        $orderId = 'CK-CAMPAIGN-FEATURE';
        $emails = ['campaign-feature-admin@example.com', 'campaign-feature-customer@example.com'];

        try {
            DB::table('kitchen_order_lines')->where('orderId', $orderId)->delete();
            DB::table('kitchen_orders')->where('id', $orderId)->delete();
            DB::table('kitchen_campaigns')->whereIn('id', $campaignIds)->delete();
            DB::table('users')->whereIn('email', $emails)->delete();
            $admin = User::create(['name' => 'Campaign Feature Admin', 'email' => $emails[0], 'password' => Hash::make('CampaignFeaturePass123'), 'role' => 'admin']);
            $customer = User::create(['name' => 'Campaign Feature Customer', 'email' => $emails[1], 'password' => Hash::make('CampaignFeaturePass123'), 'role' => 'customer']);
            $controller = app(StoreApiController::class);

            $requestFor = static function (User $user, array $payload = []): Request {
                $request = Request::create('/api/campaigns/campaign-feature-live', 'PUT', $payload);
                $request->setUserResolver(static fn () => $user);
                return $request;
            };
            try {
                $controller->saveCampaign($requestFor($customer, ['name' => 'Blocked', 'type' => 'percent', 'value' => 10, 'targetType' => 'all', 'startsAt' => now()->subMinute()->toDateTimeString(), 'endsAt' => now()->addHour()->toDateTimeString(), 'enabled' => true]), 'campaign-feature-live');
                $this->fail('Customer campaign creation should be forbidden.');
            } catch (HttpException $exception) {
                $this->assertSame(403, $exception->getStatusCode());
            }

            $live = ['name' => 'Live campaign', 'type' => 'percent', 'value' => 15, 'minSpend' => 0, 'targetType' => 'categories', 'targetValues' => ['dorsha-cups'], 'startsAt' => now()->subMinute()->toDateTimeString(), 'endsAt' => now()->addHour()->toDateTimeString(), 'enabled' => true, 'priority' => 1];
            $this->assertSame('dorsha-cups', $controller->saveCampaign($requestFor($admin, $live), 'campaign-feature-live')->getData(true)['targetValues'][0]);
            $future = [...$live, 'name' => 'Future campaign', 'value' => 45, 'startsAt' => now()->addHour()->toDateTimeString(), 'endsAt' => now()->addHours(2)->toDateTimeString(), 'priority' => 99];
            $controller->saveCampaign($requestFor($admin, $future), 'campaign-feature-future');

            $orderRequest = Request::create('/api/orders', 'POST', ['order' => ['id' => $orderId, 'address' => 'Campaign feature address', 'lines' => [['productId' => 'dorsha-ember-cup-set', 'color' => 'Oat', 'quantity' => 1]], 'subtotal' => 0, 'discount' => 0, 'shipping' => 0, 'total' => 0]]);
            $orderRequest->setUserResolver(static fn () => $customer);
            $order = $controller->createOrder($orderRequest)->getData(true);
            $this->assertSame('campaign-feature-live', $order['campaignId']);
            $this->assertEquals(19.35, $order['discount']);
            $this->assertEquals(127.65, $order['total']);

            $deleteRequest = Request::create('/api/campaigns/campaign-feature-future', 'DELETE');
            $deleteRequest->setUserResolver(static fn () => $admin);
            $this->assertTrue($controller->deleteCampaign($deleteRequest, 'campaign-feature-future')->getData(true)['success']);
            $this->assertFalse(DB::table('kitchen_campaigns')->where('id', 'campaign-feature-future')->exists());
        } finally {
            DB::table('kitchen_order_lines')->where('orderId', $orderId)->delete();
            DB::table('kitchen_orders')->where('id', $orderId)->delete();
            DB::table('kitchen_campaigns')->whereIn('id', $campaignIds)->delete();
            DB::table('sessions')->whereIn('user_id', DB::table('users')->whereIn('email', $emails)->pluck('id'))->delete();
            DB::table('password_reset_tokens')->whereIn('email', $emails)->delete();
            DB::table('users')->whereIn('email', $emails)->delete();
        }
    }
}
