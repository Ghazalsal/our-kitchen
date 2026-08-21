<?php

namespace Tests\Feature;

use App\Http\Controllers\StoreApiController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ActivityControllerBehaviorTest extends TestCase
{
    public function test_activity_requires_authentication_and_scopes_customer_data(): void
    {
        $orderIds = ['CK-ACTIVITY-ONE', 'CK-ACTIVITY-TWO'];
        $notificationIds = ['note-activity-one', 'note-activity-two'];
        $messageIds = ['msg-activity-one', 'msg-activity-two'];
        $emails = ['activity-admin@example.com', 'activity-customer@example.com', 'activity-other@example.com'];

        try {
            DB::table('kitchen_messages')->whereIn('id', $messageIds)->delete();
            DB::table('kitchen_notifications')->whereIn('id', $notificationIds)->delete();
            DB::table('kitchen_orders')->whereIn('id', $orderIds)->delete();
            DB::table('users')->whereIn('email', $emails)->delete();

            $admin = User::create(['name' => 'Activity Admin', 'email' => $emails[0], 'password' => Hash::make('ActivityPass123'), 'role' => 'admin']);
            $customer = User::create(['name' => 'Activity Customer', 'email' => $emails[1], 'password' => Hash::make('ActivityPass123'), 'role' => 'customer']);
            $otherCustomer = User::create(['name' => 'Activity Other', 'email' => $emails[2], 'password' => Hash::make('ActivityPass123'), 'role' => 'customer']);
            DB::table('kitchen_orders')->insert([
                ['id' => $orderIds[0], 'user_id' => $customer->id, 'createdAt' => now(), 'status' => 'placed', 'customerName' => $customer->name, 'customerEmail' => $customer->email, 'address' => 'Customer activity address', 'subtotal' => 100, 'discount' => 0, 'shipping' => 0, 'total' => 100, 'created_at' => now(), 'updated_at' => now()],
                ['id' => $orderIds[1], 'user_id' => $otherCustomer->id, 'createdAt' => now(), 'status' => 'placed', 'customerName' => $otherCustomer->name, 'customerEmail' => $otherCustomer->email, 'address' => 'Other activity address', 'subtotal' => 100, 'discount' => 0, 'shipping' => 0, 'total' => 100, 'created_at' => now(), 'updated_at' => now()],
            ]);
            DB::table('kitchen_notifications')->insert([
                ['id' => $notificationIds[0], 'audience' => 'customer', 'user_id' => $customer->id, 'title' => 'Customer update', 'body' => 'Customer-only notification', 'orderId' => $orderIds[0], 'createdAt' => now(), 'read' => false],
                ['id' => $notificationIds[1], 'audience' => 'customer', 'user_id' => $otherCustomer->id, 'title' => 'Other update', 'body' => 'Other-customer notification', 'orderId' => $orderIds[1], 'createdAt' => now(), 'read' => false],
            ]);
            DB::table('kitchen_messages')->insert([
                ['id' => $messageIds[0], 'orderId' => $orderIds[0], 'sender' => 'admin', 'body' => 'Customer-only message', 'createdAt' => now()],
                ['id' => $messageIds[1], 'orderId' => $orderIds[1], 'sender' => 'admin', 'body' => 'Other-customer message', 'createdAt' => now()],
            ]);

            $controller = app(StoreApiController::class);
            $requestFor = static function (?User $user): Request {
                $request = Request::create('/api/store/activity', 'GET');
                $request->setUserResolver(static fn () => $user);
                return $request;
            };

            try {
                $controller->activity($requestFor(null));
                $this->fail('Unauthenticated activity access should be rejected.');
            } catch (HttpException $exception) {
                $this->assertSame(401, $exception->getStatusCode());
            }

            $customerActivity = $controller->activity($requestFor($customer))->getData(true);
            $this->assertSame([$orderIds[0]], array_column($customerActivity['orders'], 'id'));
            $this->assertSame([$notificationIds[0]], array_column($customerActivity['notifications'], 'id'));
            $this->assertSame([$messageIds[0]], array_column($customerActivity['messages'], 'id'));

            $adminActivity = $controller->activity($requestFor($admin))->getData(true);
            $this->assertContains($orderIds[0], array_column($adminActivity['orders'], 'id'));
            $this->assertContains($orderIds[1], array_column($adminActivity['orders'], 'id'));
            $this->assertContains($notificationIds[0], array_column($adminActivity['notifications'], 'id'));
            $this->assertContains($notificationIds[1], array_column($adminActivity['notifications'], 'id'));
        } finally {
            DB::table('kitchen_messages')->whereIn('id', $messageIds)->delete();
            DB::table('kitchen_notifications')->whereIn('id', $notificationIds)->delete();
            DB::table('kitchen_orders')->whereIn('id', $orderIds)->delete();
            DB::table('sessions')->whereIn('user_id', DB::table('users')->whereIn('email', $emails)->pluck('id'))->delete();
            DB::table('password_reset_tokens')->whereIn('email', $emails)->delete();
            DB::table('users')->whereIn('email', $emails)->delete();
        }
    }
}
