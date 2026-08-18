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

class AuthController extends Controller
{
    public function csrf(): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user() ? $this->payload($request->user()) : null]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'string', 'email:rfc', 'max:320', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        $user = User::create([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'password' => Hash::make($data['password']),
            'role' => 'customer',
        ]);

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->payload($user), 'message' => 'Check your email for the verification link.'], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],
        ]);
        $key = 'login:'.strtolower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) abort(429, 'Too many sign-in attempts. Please wait a minute and try again.');

        if (!Auth::attempt(['email' => strtolower($data['email']), 'password' => $data['password']])) {
            RateLimiter::hit($key, 60);
            abort(422, 'These credentials do not match our records.');
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        /** @var User $user */
        $user = $request->user();
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
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role, 'emailVerified' => $user->hasVerifiedEmail()];
    }
}
