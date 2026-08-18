<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StoreApiController;

Route::get('/manus-storage/{key}', [StoreApiController::class, 'serveMedia'])->where('key', '.*');

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
