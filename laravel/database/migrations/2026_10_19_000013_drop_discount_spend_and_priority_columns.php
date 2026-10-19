<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Campaigns and coupons are now just a type, a value, a window and a target: no spend thresholds, caps or priority. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kitchen_campaigns', function (Blueprint $table) {
            $table->dropColumn(['minSpend', 'maxDiscount', 'priority']);
        });
        Schema::table('kitchen_coupons', function (Blueprint $table) {
            $table->dropColumn(['minSpend', 'maxDiscount']);
        });
    }

    public function down(): void
    {
        Schema::table('kitchen_campaigns', function (Blueprint $table) {
            $table->decimal('minSpend', 10, 2)->default(0);
            $table->decimal('maxDiscount', 10, 2)->nullable();
            $table->unsignedInteger('priority')->default(0);
        });
        Schema::table('kitchen_coupons', function (Blueprint $table) {
            $table->decimal('minSpend', 10, 2)->default(0);
            $table->decimal('maxDiscount', 10, 2)->nullable();
        });
    }
};
