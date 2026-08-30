<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kitchen_media_files', function (Blueprint $table) {
            $table->string('purpose', 20)->default('product')->after('id');
            $table->string('entityId', 80)->nullable()->index()->after('purpose');
        });
    }

    public function down(): void
    {
        Schema::table('kitchen_media_files', function (Blueprint $table) {
            $table->dropIndex(['entityId']);
            $table->dropColumn(['purpose', 'entityId']);
        });
    }
};
