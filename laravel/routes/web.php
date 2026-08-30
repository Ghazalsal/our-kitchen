<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StoreApiController;
use App\Http\Controllers\AuthController;

Route::get('/media/{key}', [StoreApiController::class, 'serveMedia'])->where('key', '.*');
Route::get('/{directory}/{file}', function (string $directory, string $file) {
    abort_unless(in_array($directory, ['images', 'catalog'], true), 404);
    abort_unless(preg_match('/^[A-Za-z0-9._-]+$/', $file), 404);
    $path = public_path($directory.'/'.$file);
    if (!is_file($path)) $path = base_path('../dist/public/'.$directory.'/'.$file);
    abort_unless(is_file($path), 404);
    return response()->file($path, [
        'Cache-Control' => 'public, max-age=31536000, immutable',
        'X-Content-Type-Options' => 'nosniff',
    ]);
})->where(['directory' => 'images|catalog', 'file' => '[A-Za-z0-9._-]+']);

Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::get('/reset-password/{token}', fn (string $token) => redirect('/reset-password?token='.urlencode($token).'&email='.urlencode((string) request('email'))))
    ->name('password.reset');

Route::get('/manifest.webmanifest', function () {
    $manifest = public_path('manifest.webmanifest');
    if (!is_file($manifest)) $manifest = base_path('../dist/public/manifest.webmanifest');
    abort_unless(is_file($manifest), 404);
    return response()->file($manifest, ['Content-Type' => 'application/manifest+json; charset=utf-8']);
});

Route::get('/assets/{asset}', function (string $asset) {
    $path = public_path('assets/'.$asset);
    if (!is_file($path)) $path = base_path('../dist/public/assets/'.$asset);
    abort_unless(is_file($path), 404);
    $extension = pathinfo($path, PATHINFO_EXTENSION);
    $type = match ($extension) {
        'js' => 'application/javascript; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        default => mime_content_type($path) ?: 'application/octet-stream',
    };
    return response()->file($path, ['Content-Type' => $type]);
})->where('asset', '.*');

Route::get('/{path?}', function () {
    $index = public_path('index.html');
    if (!is_file($index)) $index = base_path('../dist/public/index.html');
    return response()->file($index);
})->where('path', '^(?!api).*$');
