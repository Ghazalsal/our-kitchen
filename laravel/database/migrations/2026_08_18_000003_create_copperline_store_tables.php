<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kitchen_categories', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('name', 160);
            $table->text('description');
            $table->text('image');
            $table->timestamps();
        });

        Schema::create('kitchen_products', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('name', 200);
            $table->string('brand', 120);
            $table->decimal('price', 10, 2);
            $table->decimal('compareAt', 10, 2)->nullable();
            $table->string('categoryId', 80)->index();
            $table->text('image');
            $table->json('gallery')->nullable();
            $table->text('description');
            $table->json('features')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->json('colors')->nullable();
            $table->boolean('featured')->default(false);
            $table->boolean('deal')->default(false);
            $table->timestamps();
        });

        Schema::create('kitchen_coupons', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('code', 80)->unique();
            $table->string('type', 32);
            $table->decimal('value', 10, 2);
            $table->decimal('minSpend', 10, 2)->default(0);
            $table->decimal('maxDiscount', 10, 2)->nullable();
            $table->unsignedInteger('usageLimit')->default(0);
            $table->unsignedInteger('uses')->default(0);
            $table->date('expiresAt');
            $table->boolean('active')->default(true);
            $table->json('categoryIds')->nullable();
            $table->timestamps();
        });

        Schema::create('kitchen_carts', function (Blueprint $table) {
            $table->string('id', 100)->primary();
            $table->json('cartLines')->nullable();
            $table->string('couponCode', 80)->nullable();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('kitchen_orders', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->timestamp('createdAt')->useCurrent();
            $table->string('status', 32)->index();
            $table->string('customerName', 160);
            $table->string('customerEmail', 320);
            $table->text('address');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('shipping', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('couponCode', 80)->nullable();
            $table->timestamps();
        });

        Schema::create('kitchen_order_lines', function (Blueprint $table) {
            $table->id();
            $table->string('orderId', 80)->index();
            $table->string('productId', 80)->index();
            $table->string('color', 80);
            $table->unsignedInteger('quantity');
            $table->string('name', 200);
            $table->decimal('price', 10, 2);
            $table->text('image');
            $table->timestamps();
        });

        Schema::create('kitchen_messages', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('orderId', 80)->index();
            $table->string('sender', 20);
            $table->text('body');
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('kitchen_notifications', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('audience', 20)->index();
            $table->string('title', 200);
            $table->text('body');
            $table->string('orderId', 80)->nullable()->index();
            $table->timestamp('createdAt')->useCurrent();
            $table->boolean('read')->default(false);
        });

        Schema::create('kitchen_media_files', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('storageKey', 512)->unique();
            $table->string('url', 1024);
            $table->string('filename', 255);
            $table->string('contentType', 120);
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kitchen_media_files');
        Schema::dropIfExists('kitchen_notifications');
        Schema::dropIfExists('kitchen_messages');
        Schema::dropIfExists('kitchen_order_lines');
        Schema::dropIfExists('kitchen_orders');
        Schema::dropIfExists('kitchen_carts');
        Schema::dropIfExists('kitchen_coupons');
        Schema::dropIfExists('kitchen_products');
        Schema::dropIfExists('kitchen_categories');
    }
};
