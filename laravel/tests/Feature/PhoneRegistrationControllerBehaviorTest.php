<?php

namespace Tests\Feature;

use App\Http\Controllers\AuthController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PhoneRegistrationControllerBehaviorTest extends TestCase
{
    public function test_customers_register_and_sign_in_with_phone_and_password_without_sms_verification(): void
    {
        $emails = ['phone-registration-customer@example.com', 'phone-registration-admin@example.com'];

        try {
            DB::table('sessions')->whereIn('user_id', DB::table('users')->whereIn('email', $emails)->pluck('id'))->delete();
            DB::table('users')->whereIn('email', $emails)->delete();
            $controller = app(AuthController::class);
            $requestFor = function (string $method, array $payload): Request {
                $request = Request::create('/api/auth', $method, $payload);
                $request->setLaravelSession(app('session.store'));
                return $request;
            };

            $registered = $controller->register($requestFor('POST', [
                'name' => 'Phone Customer',
                'email' => $emails[0],
                'phone' => '059 123 4567',
                'password' => 'PhoneCustomerPass123',
                'password_confirmation' => 'PhoneCustomerPass123',
            ]))->getData(true)['user'];

            $this->assertSame('+970591234567', $registered['phone']);
            $this->assertFalse($registered['phoneVerified']);
            $this->assertSame('customer', $registered['role']);
            $this->assertSame('+970591234567', User::where('email', $emails[0])->value('phone'));

            Auth::logout();
            $signedIn = $controller->login($requestFor('POST', [
                'identifier' => '+970 59 123 4567',
                'password' => 'PhoneCustomerPass123',
            ]))->getData(true)['user'];
            $this->assertSame($registered['id'], $signedIn['id']);
            $this->assertSame('+970591234567', $signedIn['phone']);

            try {
                $controller->register($requestFor('POST', [
                    'name' => 'Duplicate Phone',
                    'email' => 'phone-registration-duplicate@example.com',
                    'phone' => '0591234567',
                    'password' => 'DuplicatePhonePass123',
                    'password_confirmation' => 'DuplicatePhonePass123',
                ]));
                $this->fail('Duplicate normalized phone registration should be rejected.');
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('phone', $exception->errors());
            }

            $admin = User::create(['name' => 'Phone Registration Admin', 'email' => $emails[1], 'password' => Hash::make('PhoneAdminPass123'), 'role' => 'admin']);
            Auth::logout();
            $adminLogin = $controller->login($requestFor('POST', [
                'identifier' => $admin->email,
                'password' => 'PhoneAdminPass123',
            ]))->getData(true)['user'];
            $this->assertSame('admin', $adminLogin['role']);
            $this->assertNull($adminLogin['phone']);
        } finally {
            Auth::logout();
            DB::table('sessions')->whereIn('user_id', DB::table('users')->whereIn('email', $emails)->pluck('id'))->delete();
            DB::table('users')->whereIn('email', [...$emails, 'phone-registration-duplicate@example.com'])->delete();
        }
    }
}
