<?php

use App\Http\Controllers\StoreApiController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->prefix('auth')->group(function () {
    Route::get('/csrf', [AuthController::class, 'csrf']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/verification/resend', [AuthController::class, 'resendVerification']);
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
    Route::post('/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
});

Route::middleware('web')->group(function () {
    Route::get('/store/bootstrap', [StoreApiController::class, 'bootstrap']);
    Route::post('/catalog/sync', [StoreApiController::class, 'syncCatalog']);
    Route::put('/products/{id}', [StoreApiController::class, 'saveProduct']);
    Route::delete('/products/{id}', [StoreApiController::class, 'deleteProduct']);
    Route::put('/coupons/{id}', [StoreApiController::class, 'saveCoupon']);
    Route::delete('/coupons/{id}', [StoreApiController::class, 'deleteCoupon']);
    Route::put('/carts/{id}', [StoreApiController::class, 'saveCart']);
    Route::get('/carts/{id}', [StoreApiController::class, 'getCart']);
    Route::post('/orders', [StoreApiController::class, 'createOrder']);
    Route::patch('/orders/{id}/status', [StoreApiController::class, 'updateOrderStatus']);
    Route::post('/orders/{id}/messages', [StoreApiController::class, 'sendMessage']);
    Route::post('/notifications/read', [StoreApiController::class, 'markNotificationsRead']);
    Route::post('/media', [StoreApiController::class, 'uploadMedia']);
});
