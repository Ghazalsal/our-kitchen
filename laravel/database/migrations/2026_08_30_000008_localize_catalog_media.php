<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $images = [
            '/manus-storage/our-kitchen-hero_5efbd6f3.jpg' => '/catalog/hero.webp',
            '/manus-storage/our-kitchen-espresso_f659044b.jpg' => '/catalog/espresso.webp',
            '/manus-storage/our-kitchen-baking_12b30794.jpg' => '/catalog/baking.webp',
            '/manus-storage/our-kitchen-prep_a5c67760.jpg' => '/catalog/prep.webp',
            '/manus-storage/our-kitchen-kettle_ceb87d69.jpg' => '/catalog/kettle.webp',
            '/manus-storage/our-kitchen-blender_8d88c11f.jpg' => '/catalog/blender.webp',
            '/manus-storage/our-kitchen-grill_c38febf9.jpg' => '/catalog/grill.webp',
            '/manus-storage/our-kitchen-toaster_5bfd81c0.jpg' => '/catalog/toaster.webp',
            '/manus-storage/dorsha-serving-bowl_6af95bde.webp' => '/catalog/dorsha-serving.jpg',
            '/manus-storage/dorsha-cups-bowls_37c3f7bb.jpeg' => '/catalog/dorsha-cups.jpeg',
            '/manus-storage/dorsha-plates_c109b6df.jpg' => '/catalog/dorsha-plates.jpg',
            '/manus-storage/dorsha-cutlery_7ca62216.jpg' => '/catalog/dorsha-cutlery.jpg',
        ];

        foreach ($images as $legacy => $local) {
            DB::table('kitchen_products')->where('image', $legacy)->update(['image' => $local]);
            DB::table('kitchen_products')->where('gallery', 'like', '%'.$legacy.'%')
                ->update(['gallery' => DB::raw("REPLACE(gallery, ".DB::getPdo()->quote($legacy).", ".DB::getPdo()->quote($local).")")]);
            DB::table('kitchen_categories')->where('image', $legacy)->update(['image' => $local]);
            DB::table('kitchen_order_lines')->where('image', $legacy)->update(['image' => $local]);
        }
    }

    public function down(): void
    {
        // Catalog assets intentionally remain local after rollback to avoid restoring an external dependency.
    }
};
