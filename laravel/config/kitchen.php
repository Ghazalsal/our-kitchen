<?php

return [
    // Keep registration and checkout friction-free until a transactional mail provider is connected.
    // Set KITCHEN_REQUIRE_EMAIL_VERIFICATION=true when real verification delivery is ready.
    'require_email_verification' => filter_var(env('KITCHEN_REQUIRE_EMAIL_VERIFICATION', false), FILTER_VALIDATE_BOOL),
    // Application-owned product/category media. On Injazat, mount a persistent volume at
    // /var/www/html/storage/app/kitchen-media so uploads survive restarts and redeploys.
    'media_disk' => 'kitchen_media',
];
