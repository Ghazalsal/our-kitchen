<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kitchen_campaigns', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('name', 160);
            $table->string('type', 32);
            $table->decimal('value', 10, 2)->default(0);
            $table->decimal('minSpend', 10, 2)->default(0);
            $table->decimal('maxDiscount', 10, 2)->nullable();
            $table->string('targetType', 24)->default('all');
            $table->json('targetValues')->nullable();
            $table->timestamp('startsAt')->index();
            $table->timestamp('endsAt')->index();
            $table->boolean('enabled')->default(true)->index();
            $table->unsignedInteger('priority')->default(0);
            $table->timestamps();
        });

        Schema::table('kitchen_orders', function (Blueprint $table) {
            $table->string('campaignId', 80)->nullable()->index()->after('couponCode');
        });
    }

    public function down(): void
    {
        Schema::table('kitchen_orders', function (Blueprint $table) {
            $table->dropColumn('campaignId');
        });
        Schema::dropIfExists('kitchen_campaigns');
    }
};
