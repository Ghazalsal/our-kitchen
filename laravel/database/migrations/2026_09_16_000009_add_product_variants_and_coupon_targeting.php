<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kitchen_products', function (Blueprint $table) {
            $table->json('sizes')->nullable()->after('colors');
        });

        Schema::table('kitchen_coupons', function (Blueprint $table) {
            $table->json('productIds')->nullable()->after('categoryIds');
        });

        Schema::table('kitchen_order_lines', function (Blueprint $table) {
            $table->string('size', 80)->default('')->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('kitchen_order_lines', function (Blueprint $table) {
            $table->dropColumn('size');
        });

        Schema::table('kitchen_coupons', function (Blueprint $table) {
            $table->dropColumn('productIds');
        });

        Schema::table('kitchen_products', function (Blueprint $table) {
            $table->dropColumn('sizes');
        });
    }
};
