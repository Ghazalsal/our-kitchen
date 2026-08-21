<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function csrf(Request $request): JsonResponse
    {
        $request->session()->regenerateToken();
        return response()->json(['success' => true, 'token' => $request->session()->token()]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user() ? $this->payload($request->user()) : null]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->merge(['phone' => $this->normalisePalestinianMobile((string) $request->input('phone', ''))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'string', 'email:rfc', 'max:320', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        $user = User::create([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'role' => 'customer',
        ]);

        $emailVerificationRequired = (bool) config('kitchen.require_email_verification');
        if ($emailVerificationRequired) event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->payload($user), 'message' => $emailVerificationRequired ? 'Check your email for the verification link.' : 'Your account is ready.'], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:320'],
            'password' => ['required', 'string'],
        ]);
        $identifier = trim($data['identifier']);
        $credentials = str_contains($identifier, '@')
            ? ['email' => strtolower($identifier), 'password' => $data['password']]
            : ['phone' => $this->normalisePalestinianMobile($identifier), 'password' => $data['password']];
        $key = 'login:'.strtolower((string) ($credentials['email'] ?? $credentials['phone'])).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) abort(429, 'Too many sign-in attempts. Please wait a minute and try again.');

        if (!Auth::attempt($credentials)) {
            RateLimiter::hit($key, 60);
            abort(422, 'These credentials do not match our records.');
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        /** @var User $user */
        $user = Auth::user();
        abort_unless($user instanceof User, 401, 'Unable to establish a secure session.');
        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json(['user' => $this->payload($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['success' => true]);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_unless($user, 401, 'Please sign in first.');
        if (!config('kitchen.require_email_verification')) return response()->json(['message' => 'Email verification is not required at the moment.']);
        if ($user->hasVerifiedEmail()) return response()->json(['message' => 'Your email is already verified.']);
        $key = 'verify:'.$user->id;
        if (RateLimiter::tooManyAttempts($key, 3)) abort(429, 'Please wait before requesting another verification email.');
        RateLimiter::hit($key, 60);
        $user->sendEmailVerificationNotification();
        return response()->json(['message' => 'A fresh verification link has been sent.']);
    }

    public function verifyEmail(Request $request, int $id, string $hash): RedirectResponse
    {
        /** @var User $user */
        $user = User::query()->findOrFail($id);
        abort_unless(hash_equals($hash, sha1($user->getEmailForVerification())), 403, 'Invalid verification link.');
        if (!$user->hasVerifiedEmail() && $user->markEmailAsVerified()) event(new Verified($user));
        return redirect('/?verified=1');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email:rfc']]);
        $key = 'reset:'.strtolower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) abort(429, 'Please wait before requesting another reset link.');
        RateLimiter::hit($key, 60);
        Password::sendResetLink(['email' => strtolower($data['email'])]);
        return response()->json(['message' => 'If an account exists, a password reset link has been sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);
        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
        });
        if ($status !== Password::PASSWORD_RESET) abort(422, __($status));
        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }

    private function payload(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone, 'phoneVerified' => false, 'role' => $user->role, 'emailVerified' => $user->hasVerifiedEmail(), 'emailVerificationRequired' => (bool) config('kitchen.require_email_verification')];
    }

    private function normalisePalestinianMobile(string $phone): string
    {
        $digits = preg_replace('/\D/', '', trim($phone)) ?? '';
        if (str_starts_with($digits, '00')) $digits = substr($digits, 2);
        if (str_starts_with($digits, '0')) $digits = '970'.substr($digits, 1);
        if (!preg_match('/^(970|972)5\d{8}$/', $digits)) {
            throw ValidationException::withMessages(['phone' => 'Enter a Palestinian mobile number, for example 059 123 4567 or +970 59 123 4567.']);
        }
        return '+'.$digits;
    }
}
