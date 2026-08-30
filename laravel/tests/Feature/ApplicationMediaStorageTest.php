<?php

namespace Tests\Feature;

use App\Http\Controllers\StoreApiController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicationMediaStorageTest extends TestCase
{
    public function test_admin_uploads_category_media_to_application_storage_with_database_metadata(): void
    {
        Storage::fake('kitchen_media');
        $email = 'application-media-admin@example.com';
        $mediaId = null;

        try {
            DB::table('users')->where('email', $email)->delete();
            $admin = User::create([
                'name' => 'Application Media Admin',
                'email' => $email,
                'password' => Hash::make('ApplicationMediaAdmin123'),
                'role' => 'admin',
            ]);

            $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
            $request = Request::create('/api/media', 'POST', [
                'purpose' => 'category',
                'entityId' => 'category-media-test',
            ], [], [
                'file' => UploadedFile::fake()->createWithContent('category.png', $png),
            ]);
            $request->setUserResolver(fn () => $admin);

            $response = app(StoreApiController::class)->uploadMedia($request);
            $payload = $response->getData(true);

            $this->assertSame(201, $response->getStatusCode());
            $this->assertStringStartsWith('categories/', $payload['key']);
            $this->assertSame('/media/'.$payload['key'], $payload['url']);
            Storage::disk('kitchen_media')->assertExists($payload['key']);

            $record = DB::table('kitchen_media_files')->where('storageKey', $payload['key'])->first();
            $this->assertNotNull($record);
            $mediaId = $record->id;
            $this->assertSame('category', $record->purpose);
            $this->assertSame('category-media-test', $record->entityId);
            $this->assertSame('image/png', $record->contentType);

            $served = app(StoreApiController::class)->serveMedia($payload['key']);
            $this->assertSame(200, $served->getStatusCode());
            $this->assertSame('nosniff', $served->headers->get('X-Content-Type-Options'));
        } finally {
            if ($mediaId) DB::table('kitchen_media_files')->where('id', $mediaId)->delete();
            DB::table('users')->where('email', $email)->delete();
        }
    }
}
