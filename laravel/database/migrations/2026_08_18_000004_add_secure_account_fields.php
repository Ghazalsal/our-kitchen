<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('customer')->index()->after('email');
            $table->timestamp('last_login_at')->nullable()->after('remember_token');
        });
        Schema::table('kitchen_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->index()->after('id');
        });
        Schema::table('kitchen_notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->index()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('kitchen_notifications', fn (Blueprint $table) => $table->dropColumn('user_id'));
        Schema::table('kitchen_orders', fn (Blueprint $table) => $table->dropColumn('user_id'));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'last_login_at']));
    }
};
