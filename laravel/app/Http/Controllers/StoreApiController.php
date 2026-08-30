<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StoreApiController extends Controller
{
    public function serveMedia(string $key)
    {
        abort_unless(preg_match('#^(products|categories)/[a-f0-9-]+\.(?:jpg|jpeg|png|webp|avif)$#i', $key), 404);
        $disk = Storage::disk(config('kitchen.media_disk'));
        abort_unless($disk->exists($key), 404, 'Media file was not found.');

        return response($disk->get($key), 200, [
            'Content-Type' => $disk->mimeType($key) ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.basename($key).'"',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function bootstrap(Request $request): JsonResponse
    {
        return response()->json($this->storeState($request->user()));
    }

    public function activity(Request $request): JsonResponse
    {
        return response()->json($this->activityState($this->requireUser($request)));
    }

    public function syncCatalog(Request $request): JsonResponse
    {
        if (DB::table('kitchen_products')->exists()) $this->requireAdmin($request);
        $catalog = $request->validate([
            'products' => ['array'], 'categories' => ['array'], 'coupons' => ['array'],
        ]);
        DB::transaction(function () use ($catalog) {
            foreach ($catalog['categories'] ?? [] as $category) $this->upsertCategory($category);
            foreach ($catalog['products'] ?? [] as $product) $this->upsertProduct($product);
            foreach ($catalog['coupons'] ?? [] as $coupon) $this->upsertCoupon($coupon);
        });
        return response()->json($this->storeState($request->user()));
    }

    public function saveProduct(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $product = array_merge($request->all(), ['id' => $id]);
        $request->validate(['name' => ['required', 'string', 'max:200'], 'brand' => ['required', 'string', 'max:120'], 'price' => ['required', 'numeric'], 'categoryId' => ['required', 'string', 'max:80'], 'image' => ['required', 'string'], 'published' => ['nullable', 'boolean']]);
        $this->upsertProduct($product);
        return response()->json($this->productById($id));
    }

    public function saveCategory(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $category = array_merge($request->all(), ['id' => $id]);
        $request->validate(['name' => ['required', 'string', 'max:160'], 'hue' => ['nullable', 'string', 'max:20']]);
        $this->upsertCategory($category);
        return response()->json($this->categoryById($id));
    }

    public function deleteCategory(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        DB::table('kitchen_categories')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function deleteProduct(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        DB::table('kitchen_products')->where('id', $id)->delete();
        DB::table('kitchen_order_lines')->where('productId', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function saveCoupon(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $coupon = array_merge($request->all(), ['id' => $id]);
        $request->validate(['code' => ['required', 'string', 'max:80'], 'type' => ['required', 'in:percent,fixed,free_shipping'], 'value' => ['required', 'numeric'], 'expiresAt' => ['required', 'date']]);
        $this->upsertCoupon($coupon);
        return response()->json($this->couponById($id));
    }

    public function deleteCoupon(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        DB::table('kitchen_coupons')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function saveCampaign(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $campaign = array_merge($request->all(), ['id' => $id]);
        validator($campaign, [
            'name' => ['required', 'string', 'max:160'],
            'type' => ['required', 'in:percent,fixed,free_shipping'],
            'value' => ['required', 'numeric', 'min:0'],
            'minSpend' => ['nullable', 'numeric', 'min:0'],
            'maxDiscount' => ['nullable', 'numeric', 'min:0'],
            'targetType' => ['required', 'in:all,brand,categories'],
            'targetValues' => ['nullable', 'array'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'enabled' => ['boolean'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ])->validate();
        if ($campaign['targetType'] !== 'all') abort_if(empty($campaign['targetValues']), 422, 'Select at least one campaign target.');
        $campaign['targetValues'] = $campaign['targetType'] === 'all' ? [] : array_values($campaign['targetValues'] ?? []);
        $this->upsertCampaign($campaign);
        return response()->json($this->campaignById($id));
    }

    public function deleteCampaign(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        DB::table('kitchen_campaigns')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function getCart(Request $request, string $id): JsonResponse
    {
        $user = $this->requireUser($request);
        abort_unless($id === 'cart-'.$user->id, 403, 'Cart ownership is required.');
        $cart = DB::table('kitchen_carts')->where('id', $id)->first();
        return response()->json($cart ? [
            'cart' => $this->decode($cart->cartLines),
            'saveForLater' => $this->decode($cart->saveForLater ?? '[]'),
            'couponCode' => $cart->couponCode
        ] : ['cart' => [], 'saveForLater' => [], 'couponCode' => null]);
    }

    public function saveCart(Request $request, string $id): JsonResponse
    {
        $user = $this->requireUser($request);
        abort_unless($id === 'cart-'.$user->id, 403, 'Cart ownership is required.');
        $data = $request->validate([
            'cart' => ['array'],
            'saveForLater' => ['nullable', 'array'],
            'couponCode' => ['nullable', 'string', 'max:80']
        ]);
        DB::table('kitchen_carts')->updateOrInsert(['id' => $id], [
            'cartLines' => json_encode($data['cart'] ?? []),
            'saveForLater' => json_encode($data['saveForLater'] ?? []),
            'couponCode' => $data['couponCode'] ?? null,
            'updatedAt' => now()
        ]);
        return response()->json(['success' => true]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $user = config('kitchen.require_email_verification') ? $this->requireVerifiedUser($request) : $this->requireUser($request);
        $order = array_merge($request->input('order', $request->all()), ['customerName' => $user->name, 'customerEmail' => $user->email]);
        validator($order, ['id' => ['required', 'string', 'max:80'], 'customerName' => ['required', 'string'], 'customerEmail' => ['required', 'email'], 'address' => ['required', 'string'], 'lines' => ['required', 'array', 'min:1']])->validate();
        $productRows = DB::table('kitchen_products')->whereIn('id', collect($order['lines'])->pluck('productId')->filter()->unique())->get()->keyBy('id');
        $lines = collect($order['lines'])->map(function (array $line) use ($productRows) {
            $product = $productRows->get($line['productId'] ?? '');
            abort_unless($product && !empty($line['quantity']) && (int) $line['quantity'] > 0, 422, 'One or more order products are unavailable.');
            return ['productId' => $product->id, 'color' => (string) ($line['color'] ?? ''), 'quantity' => (int) $line['quantity'], 'name' => $product->name, 'price' => (float) $product->price, 'image' => $product->image, 'brand' => $product->brand, 'categoryId' => $product->categoryId];
        })->all();
        $subtotal = round(collect($lines)->sum(fn (array $line) => $line['price'] * $line['quantity']), 2);
        $coupon = $this->couponDiscount((string) ($order['couponCode'] ?? ''), $lines, $subtotal);
        $campaign = $this->campaignDiscount($lines, $subtotal);
        $discount = min($subtotal, round($coupon['discount'] + $campaign['discount'], 2));
        $shipping = $coupon['freeShipping'] || $campaign['freeShipping'] || $subtotal >= 300 ? 0 : 18;
        $order = array_merge($order, ['lines' => $lines, 'subtotal' => $subtotal, 'discount' => $discount, 'shipping' => $shipping, 'total' => max(0, round($subtotal - $discount + $shipping, 2)), 'couponCode' => $coupon['coupon']?->code, 'campaignId' => $campaign['campaign']?->id]);
        DB::transaction(function () use ($order, $user) {
            DB::table('kitchen_orders')->updateOrInsert(['id' => $order['id']], [
                'user_id' => $user->id, 'createdAt' => $order['createdAt'] ?? now(), 'status' => $order['status'] ?? 'placed', 'customerName' => $order['customerName'], 'customerEmail' => $order['customerEmail'], 'address' => $order['address'], 'subtotal' => $order['subtotal'], 'discount' => $order['discount'], 'shipping' => $order['shipping'], 'total' => $order['total'], 'couponCode' => $order['couponCode'] ?? null, 'campaignId' => $order['campaignId'] ?? null, 'updated_at' => now(), 'created_at' => now(),
            ]);
            DB::table('kitchen_order_lines')->where('orderId', $order['id'])->delete();
            foreach ($order['lines'] as $line) DB::table('kitchen_order_lines')->insert(['orderId' => $order['id'], 'productId' => $line['productId'], 'color' => $line['color'], 'quantity' => $line['quantity'], 'name' => $line['name'], 'price' => $line['price'], 'image' => $line['image'], 'created_at' => now(), 'updated_at' => now()]);
            if (!empty($order['couponCode'])) DB::table('kitchen_coupons')->whereRaw('LOWER(code) = ?', [strtolower($order['couponCode'])])->increment('uses');
            $this->notify('admin', 'A fresh order is on the counter', "{$order['id']} has been placed for ₪" . number_format((float) $order['total'], 2) . '.', $order['id']);
        });
        return response()->json($this->orderById($order['id']), 201);
    }

    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate(['status' => ['required', 'in:placed,confirmed,preparing,shipped,delivered,cancelled']]);
        DB::table('kitchen_orders')->where('id', $id)->update(['status' => $data['status'], 'updated_at' => now()]);
        $this->notify('customer', 'Your order has moved', "{$id} is now {$data['status']}.", $id);
        return response()->json($this->orderById($id));
    }

    public function sendMessage(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['sender' => ['required', 'in:admin,customer'], 'body' => ['required', 'string', 'max:4000']]);
        $user = $this->requireUser($request);
        if ($data['sender'] === 'admin') $this->requireAdmin($request);
        else abort_unless((int) DB::table('kitchen_orders')->where('id', $id)->value('user_id') === $user->id, 403, 'Order ownership is required.');
        $message = ['id' => 'msg-'.Str::uuid(), 'orderId' => $id, 'sender' => $data['sender'], 'body' => $data['body'], 'createdAt' => now()];
        DB::table('kitchen_messages')->insert($message);
        $this->notify($data['sender'] === 'customer' ? 'admin' : 'customer', $data['sender'] === 'customer' ? 'New order question' : 'A note from the kitchen', Str::limit($data['body'], 72), $id);
        return response()->json($this->messageRow((object) $message), 201);
    }

    public function markNotificationsRead(Request $request): JsonResponse
    {
        $data = $request->validate(['audience' => ['required', 'in:admin,customer']]);
        $user = $this->requireUser($request);
        $query = DB::table('kitchen_notifications')->where('audience', $data['audience']);
        if ($data['audience'] === 'admin') $this->requireAdmin($request);
        else $query->where('user_id', $user->id);
        $query->update(['read' => true]);
        return response()->json(['success' => true]);
    }

    public function uploadMedia(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate([
            'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
            'purpose' => ['nullable', 'in:product,category'],
            'entityId' => ['nullable', 'string', 'max:80'],
        ]);
        $file = $request->file('file');
        $extension = match ($file->getMimeType()) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            default => abort(422, 'Unsupported image format.'),
        };
        $folder = ($data['purpose'] ?? 'product') === 'category' ? 'categories' : 'products';
        $key = $folder.'/'.Str::uuid().'.'.$extension;
        Storage::disk(config('kitchen.media_disk'))->put($key, file_get_contents($file->getRealPath()));
        $url = '/media/'.$key;
        DB::table('kitchen_media_files')->insert([
            'id' => 'media-'.Str::uuid(),
            'purpose' => $data['purpose'] ?? 'product',
            'entityId' => $data['entityId'] ?? null,
            'storageKey' => $key,
            'url' => $url,
            'filename' => basename($file->getClientOriginalName()),
            'contentType' => $file->getMimeType(),
            'size' => $file->getSize(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['key' => $key, 'url' => $url], 201);
    }

    private function storeState(?User $user): array
    {
        $activity = $this->activityState($user);
        $campaigns = DB::table('kitchen_campaigns')->orderByDesc('priority')->orderBy('startsAt');
        if (!$user || $user->role !== 'admin') $campaigns->where('enabled', true)->where('endsAt', '>', now());

        $productsQuery = DB::table('kitchen_products')->orderByDesc('updated_at');
        if (!$user || $user->role !== 'admin') {
            $productsQuery->where('published', true)->where('stock', '>', 0);
        }

        return [
            'products' => $productsQuery->get()->map(fn ($row) => $this->productRow($row))->all(),
            'categories' => DB::table('kitchen_categories')->orderBy('name')->get()->map(fn ($row) => $this->categoryRow($row))->all(),
            'coupons' => DB::table('kitchen_coupons')->orderByDesc('updated_at')->get()->map(fn ($row) => $this->couponRow($row))->all(),
            'campaigns' => $campaigns->get()->map(fn ($row) => $this->campaignRow($row))->all(),
            ...$activity
        ];
    }

    private function activityState(?User $user): array
    {
        $orders = DB::table('kitchen_orders')->orderByDesc('createdAt');
        $notifications = DB::table('kitchen_notifications')->orderByDesc('createdAt');
        if (!$user) { $orders->whereRaw('1 = 0'); $notifications->whereRaw('1 = 0'); }
        elseif ($user->role !== 'admin') { $orders->where('user_id', $user->id); $notifications->where('user_id', $user->id); }
        $orderRows = $orders->get();
        $orderIds = $orderRows->pluck('id')->all();
        return ['orders' => $orderRows->map(fn ($row) => $this->orderRow($row))->all(), 'notifications' => $notifications->get()->map(fn ($row) => $this->notificationRow($row))->all(), 'messages' => empty($orderIds) ? [] : DB::table('kitchen_messages')->whereIn('orderId', $orderIds)->orderBy('createdAt')->get()->map(fn ($row) => $this->messageRow($row))->all()];
    }

    private function upsertCategory(array $data): void { DB::table('kitchen_categories')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'description' => $data['description'] ?? '', 'image' => $data['image'] ?? '', 'hue' => $data['hue'] ?? 'copper', 'updated_at' => now(), 'created_at' => now()]); }
    private function upsertProduct(array $data): void { DB::table('kitchen_products')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'brand' => $data['brand'], 'price' => $data['price'], 'compareAt' => $data['compareAt'] ?? null, 'categoryId' => $data['categoryId'], 'image' => $data['image'], 'gallery' => json_encode($data['gallery'] ?? []), 'description' => $data['description'] ?? '', 'features' => json_encode($data['features'] ?? []), 'stock' => $data['stock'] ?? 0, 'colors' => json_encode($data['colors'] ?? []), 'featured' => !empty($data['featured']), 'deal' => !empty($data['deal']), 'published' => (bool) ($data['published'] ?? true), 'updated_at' => now(), 'created_at' => now()]); }
    private function upsertCoupon(array $data): void { DB::table('kitchen_coupons')->updateOrInsert(['id' => $data['id']], ['code' => strtoupper($data['code']), 'type' => $data['type'], 'value' => $data['value'], 'minSpend' => $data['minSpend'] ?? 0, 'maxDiscount' => $data['maxDiscount'] ?? null, 'usageLimit' => $data['usageLimit'] ?? 0, 'uses' => $data['uses'] ?? 0, 'expiresAt' => $data['expiresAt'], 'active' => $data['active'] ?? true, 'categoryIds' => json_encode($data['categoryIds'] ?? []), 'updated_at' => now(), 'created_at' => now()]); }
    private function upsertCampaign(array $data): void { DB::table('kitchen_campaigns')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'type' => $data['type'], 'value' => $data['value'] ?? 0, 'minSpend' => $data['minSpend'] ?? 0, 'maxDiscount' => $data['maxDiscount'] ?? null, 'targetType' => $data['targetType'], 'targetValues' => json_encode($data['targetValues'] ?? []), 'startsAt' => $data['startsAt'], 'endsAt' => $data['endsAt'], 'enabled' => $data['enabled'] ?? true, 'priority' => $data['priority'] ?? 0, 'updated_at' => now(), 'created_at' => now()]); }
    private function productById(string $id): ?array { $row = DB::table('kitchen_products')->where('id', $id)->first(); return $row ? $this->productRow($row) : null; }
    private function couponById(string $id): ?array { $row = DB::table('kitchen_coupons')->where('id', $id)->first(); return $row ? $this->couponRow($row) : null; }
    private function campaignById(string $id): ?array { $row = DB::table('kitchen_campaigns')->where('id', $id)->first(); return $row ? $this->campaignRow($row) : null; }
    private function orderById(string $id): ?array { $row = DB::table('kitchen_orders')->where('id', $id)->first(); return $row ? $this->orderRow($row) : null; }
    private function decode(?string $value): array { return $value ? json_decode($value, true) ?: [] : []; }
    private function requireUser(Request $request): User { $user = $request->user(); abort_unless($user instanceof User, 401, 'Please sign in to continue.'); return $user; }
    private function requireVerifiedUser(Request $request): User { $user = $this->requireUser($request); abort_unless($user->hasVerifiedEmail(), 403, 'Verify your email before placing an order.'); return $user; }
    private function requireAdmin(Request $request): void { $user = $this->requireUser($request); abort_unless($user->role === 'admin', 403, 'Administrator authorization is required.'); }
    private function productRow(object $row): array { return ['id' => $row->id, 'name' => $row->name, 'brand' => $row->brand, 'price' => (float) $row->price, 'compareAt' => $row->compareAt ? (float) $row->compareAt : null, 'categoryId' => $row->categoryId, 'image' => $row->image, 'gallery' => $this->decode($row->gallery), 'description' => $row->description, 'features' => $this->decode($row->features), 'stock' => (int) $row->stock, 'colors' => $this->decode($row->colors), 'featured' => (bool) $row->featured, 'deal' => (bool) $row->deal, 'published' => (bool) $row->published]; }
    private function categoryRow(object $row): array { return ['id' => $row->id, 'name' => $row->name, 'description' => $row->description, 'image' => $row->image, 'hue' => $row->hue ?? 'copper']; }
    private function categoryById(string $id): ?array { $row = DB::table('kitchen_categories')->where('id', $id)->first(); return $row ? $this->categoryRow($row) : null; }
    private function couponRow(object $row): array { return ['id' => $row->id, 'code' => $row->code, 'type' => $row->type, 'value' => (float) $row->value, 'minSpend' => (float) $row->minSpend, 'maxDiscount' => $row->maxDiscount ? (float) $row->maxDiscount : null, 'usageLimit' => (int) $row->usageLimit, 'uses' => (int) $row->uses, 'expiresAt' => (string) $row->expiresAt, 'active' => (bool) $row->active, 'categoryIds' => $this->decode($row->categoryIds)]; }
    private function campaignRow(object $row): array { return ['id' => $row->id, 'name' => $row->name, 'type' => $row->type, 'value' => (float) $row->value, 'minSpend' => (float) $row->minSpend, 'maxDiscount' => $row->maxDiscount ? (float) $row->maxDiscount : null, 'targetType' => $row->targetType, 'targetValues' => $this->decode($row->targetValues), 'startsAt' => (string) $row->startsAt, 'endsAt' => (string) $row->endsAt, 'enabled' => (bool) $row->enabled, 'priority' => (int) $row->priority]; }
    private function orderRow(object $row): array { return ['id' => $row->id, 'createdAt' => (string) $row->createdAt, 'status' => $row->status, 'customerName' => $row->customerName, 'customerEmail' => $row->customerEmail, 'address' => $row->address, 'subtotal' => (float) $row->subtotal, 'discount' => (float) $row->discount, 'shipping' => (float) $row->shipping, 'total' => (float) $row->total, 'couponCode' => $row->couponCode, 'campaignId' => $row->campaignId ?? null, 'lines' => DB::table('kitchen_order_lines')->where('orderId', $row->id)->get()->map(fn ($line) => ['productId' => $line->productId, 'color' => $line->color, 'quantity' => (int) $line->quantity, 'name' => $line->name, 'price' => (float) $line->price, 'image' => $line->image])->all()]; }
    private function messageRow(object $row): array { return ['id' => $row->id, 'orderId' => $row->orderId, 'sender' => $row->sender, 'body' => $row->body, 'createdAt' => (string) $row->createdAt]; }
    private function notificationRow(object $row): array { return ['id' => $row->id, 'audience' => $row->audience, 'title' => $row->title, 'body' => $row->body, 'orderId' => $row->orderId, 'createdAt' => (string) $row->createdAt, 'read' => (bool) $row->read]; }
    private function notify(string $audience, string $title, string $body, ?string $orderId = null): void { $userId = $audience === 'customer' && $orderId ? DB::table('kitchen_orders')->where('id', $orderId)->value('user_id') : null; DB::table('kitchen_notifications')->insert(['id' => 'note-'.Str::uuid(), 'audience' => $audience, 'user_id' => $userId, 'title' => $title, 'body' => $body, 'orderId' => $orderId, 'createdAt' => now(), 'read' => false]); }

    private function couponDiscount(string $code, array $lines, float $subtotal): array
    {
        if (!$code) return ['coupon' => null, 'discount' => 0, 'freeShipping' => false];
        $coupon = DB::table('kitchen_coupons')->whereRaw('LOWER(code) = ?', [strtolower($code)])->first();
        if (!$coupon || !$coupon->active || now()->greaterThan($coupon->expiresAt) || $subtotal < (float) $coupon->minSpend || (int) $coupon->uses >= (int) $coupon->usageLimit) return ['coupon' => null, 'discount' => 0, 'freeShipping' => false];
        $categories = $this->decode($coupon->categoryIds);
        if ($categories && collect($lines)->contains(fn (array $line) => !in_array($line['categoryId'], $categories, true))) return ['coupon' => null, 'discount' => 0, 'freeShipping' => false];
        $discount = $coupon->type === 'percent' ? min($subtotal * ((float) $coupon->value / 100), $coupon->maxDiscount ?? INF) : ($coupon->type === 'fixed' ? min((float) $coupon->value, $subtotal) : 0);
        return ['coupon' => $coupon, 'discount' => round($discount, 2), 'freeShipping' => $coupon->type === 'free_shipping'];
    }

    private function campaignDiscount(array $lines, float $subtotal): array
    {
        $campaigns = DB::table('kitchen_campaigns')->where('enabled', true)->where('startsAt', '<=', now())->where('endsAt', '>', now())->orderByDesc('priority')->orderBy('startsAt')->get();
        foreach ($campaigns as $campaign) {
            $targets = $this->decode($campaign->targetValues);
            $eligible = collect($lines)->filter(fn (array $line) => $campaign->targetType === 'all' || ($campaign->targetType === 'brand' && in_array($line['brand'], $targets, true)) || ($campaign->targetType === 'categories' && in_array($line['categoryId'], $targets, true)));
            $eligibleSubtotal = (float) $eligible->sum(fn (array $line) => $line['price'] * $line['quantity']);
            if ($eligible->isEmpty() || $eligibleSubtotal < (float) $campaign->minSpend) continue;
            $discount = $campaign->type === 'percent' ? min($eligibleSubtotal * ((float) $campaign->value / 100), $campaign->maxDiscount ?? INF) : ($campaign->type === 'fixed' ? min((float) $campaign->value, $eligibleSubtotal) : 0);
            return ['campaign' => $campaign, 'discount' => round($discount, 2), 'freeShipping' => $campaign->type === 'free_shipping'];
        }
        return ['campaign' => null, 'discount' => 0, 'freeShipping' => false];
    }
}
