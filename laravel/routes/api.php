<?php

use App\Http\Controllers\StoreApiController;
use Illuminate\Support\Facades\Route;

Route::get('/store/bootstrap', [StoreApiController::class, 'bootstrap']);
Route::post('/admin/unlock', [StoreApiController::class, 'unlockAdmin']);
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
