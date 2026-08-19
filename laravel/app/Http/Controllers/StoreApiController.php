<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class StoreApiController extends Controller
{
    public function serveMedia(string $key)
    {
        $forgeUrl = rtrim((string) env('BUILT_IN_FORGE_API_URL'), '/');
        $forgeKey = (string) env('BUILT_IN_FORGE_API_KEY');
        abort_unless($forgeUrl && $forgeKey, 503, 'Managed storage is not configured.');
        $url = Http::withToken($forgeKey)->get($forgeUrl.'/v1/storage/presign/get', ['path' => ltrim($key, '/')])->throw()->json('url');
        abort_unless($url, 404, 'Media file was not found.');
        return redirect()->away($url);
    }

    public function bootstrap(Request $request): JsonResponse
    {
        return response()->json($this->storeState($request->user()));
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
        $request->validate(['name' => ['required', 'string', 'max:200'], 'brand' => ['required', 'string', 'max:120'], 'price' => ['required', 'numeric'], 'categoryId' => ['required', 'string', 'max:80'], 'image' => ['required', 'string']]);
        $this->upsertProduct($product);
        return response()->json($this->productById($id));
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

    public function getCart(Request $request, string $id): JsonResponse
    {
        $user = $this->requireUser($request);
        abort_unless($id === 'cart-'.$user->id, 403, 'Cart ownership is required.');
        $cart = DB::table('kitchen_carts')->where('id', $id)->first();
        return response()->json($cart ? ['cart' => $this->decode($cart->cartLines), 'couponCode' => $cart->couponCode] : ['cart' => [], 'couponCode' => null]);
    }

    public function saveCart(Request $request, string $id): JsonResponse
    {
        $user = $this->requireUser($request);
        abort_unless($id === 'cart-'.$user->id, 403, 'Cart ownership is required.');
        $data = $request->validate(['cart' => ['array'], 'couponCode' => ['nullable', 'string', 'max:80']]);
        DB::table('kitchen_carts')->updateOrInsert(['id' => $id], ['cartLines' => json_encode($data['cart'] ?? []), 'couponCode' => $data['couponCode'] ?? null, 'updatedAt' => now()]);
        return response()->json(['success' => true]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $user = config('kitchen.require_email_verification') ? $this->requireVerifiedUser($request) : $this->requireUser($request);
        $order = array_merge($request->input('order', $request->all()), ['customerName' => $user->name, 'customerEmail' => $user->email]);
        validator($order, ['id' => ['required', 'string', 'max:80'], 'customerName' => ['required', 'string'], 'customerEmail' => ['required', 'email'], 'address' => ['required', 'string'], 'lines' => ['required', 'array', 'min:1'], 'total' => ['required', 'numeric']])->validate();
        DB::transaction(function () use ($order, $user) {
            DB::table('kitchen_orders')->updateOrInsert(['id' => $order['id']], [
                'user_id' => $user->id, 'createdAt' => $order['createdAt'] ?? now(), 'status' => $order['status'] ?? 'placed', 'customerName' => $order['customerName'], 'customerEmail' => $order['customerEmail'], 'address' => $order['address'], 'subtotal' => $order['subtotal'] ?? 0, 'discount' => $order['discount'] ?? 0, 'shipping' => $order['shipping'] ?? 0, 'total' => $order['total'], 'couponCode' => $order['couponCode'] ?? null, 'updated_at' => now(), 'created_at' => now(),
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
        $request->validate(['file' => ['required', 'file', 'image', 'max:5120']]);
        $file = $request->file('file');
        $forgeUrl = rtrim((string) env('BUILT_IN_FORGE_API_URL'), '/');
        $forgeKey = (string) env('BUILT_IN_FORGE_API_KEY');
        abort_unless($forgeUrl && $forgeKey, 503, 'Managed storage is not configured.');
        $extension = $file->extension() ?: 'jpg';
        $key = 'our-kitchen/products/'.Str::uuid().'.'.$extension;
        $presigned = Http::withToken($forgeKey)->get($forgeUrl.'/v1/storage/presign/put', ['path' => $key])->throw()->json('url');
        abort_unless($presigned, 502, 'Storage did not provide an upload URL.');
        Http::withBody(file_get_contents($file->getRealPath()), $file->getMimeType())->put($presigned)->throw();
        $url = '/manus-storage/'.$key;
        DB::table('kitchen_media_files')->insert(['id' => 'media-'.Str::uuid(), 'storageKey' => $key, 'url' => $url, 'filename' => $file->getClientOriginalName(), 'contentType' => $file->getMimeType(), 'size' => $file->getSize(), 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['key' => $key, 'url' => $url], 201);
    }

    private function storeState(?User $user): array
    {
        $orders = DB::table('kitchen_orders')->orderByDesc('createdAt');
        $notifications = DB::table('kitchen_notifications')->orderByDesc('createdAt');
        if (!$user) { $orders->whereRaw('1 = 0'); $notifications->whereRaw('1 = 0'); }
        elseif ($user->role !== 'admin') { $orders->where('user_id', $user->id); $notifications->where('user_id', $user->id); }
        $orderRows = $orders->get();
        $orderIds = $orderRows->pluck('id')->all();
        return ['products' => DB::table('kitchen_products')->orderByDesc('updated_at')->get()->map(fn ($row) => $this->productRow($row))->all(), 'categories' => DB::table('kitchen_categories')->orderBy('name')->get()->map(fn ($row) => ['id' => $row->id, 'name' => $row->name, 'description' => $row->description, 'image' => $row->image])->all(), 'coupons' => DB::table('kitchen_coupons')->orderByDesc('updated_at')->get()->map(fn ($row) => $this->couponRow($row))->all(), 'orders' => $orderRows->map(fn ($row) => $this->orderRow($row))->all(), 'notifications' => $notifications->get()->map(fn ($row) => $this->notificationRow($row))->all(), 'messages' => empty($orderIds) ? [] : DB::table('kitchen_messages')->whereIn('orderId', $orderIds)->orderBy('createdAt')->get()->map(fn ($row) => $this->messageRow($row))->all()];
    }

    private function upsertCategory(array $data): void { DB::table('kitchen_categories')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'description' => $data['description'] ?? '', 'image' => $data['image'] ?? '', 'updated_at' => now(), 'created_at' => now()]); }
    private function upsertProduct(array $data): void { DB::table('kitchen_products')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'brand' => $data['brand'], 'price' => $data['price'], 'compareAt' => $data['compareAt'] ?? null, 'categoryId' => $data['categoryId'], 'image' => $data['image'], 'gallery' => json_encode($data['gallery'] ?? []), 'description' => $data['description'] ?? '', 'features' => json_encode($data['features'] ?? []), 'stock' => $data['stock'] ?? 0, 'colors' => json_encode($data['colors'] ?? []), 'featured' => !empty($data['featured']), 'deal' => !empty($data['deal']), 'updated_at' => now(), 'created_at' => now()]); }
    private function upsertCoupon(array $data): void { DB::table('kitchen_coupons')->updateOrInsert(['id' => $data['id']], ['code' => strtoupper($data['code']), 'type' => $data['type'], 'value' => $data['value'], 'minSpend' => $data['minSpend'] ?? 0, 'maxDiscount' => $data['maxDiscount'] ?? null, 'usageLimit' => $data['usageLimit'] ?? 0, 'uses' => $data['uses'] ?? 0, 'expiresAt' => $data['expiresAt'], 'active' => $data['active'] ?? true, 'categoryIds' => json_encode($data['categoryIds'] ?? []), 'updated_at' => now(), 'created_at' => now()]); }
    private function productById(string $id): ?array { $row = DB::table('kitchen_products')->where('id', $id)->first(); return $row ? $this->productRow($row) : null; }
    private function couponById(string $id): ?array { $row = DB::table('kitchen_coupons')->where('id', $id)->first(); return $row ? $this->couponRow($row) : null; }
    private function orderById(string $id): ?array { $row = DB::table('kitchen_orders')->where('id', $id)->first(); return $row ? $this->orderRow($row) : null; }
    private function decode(?string $value): array { return $value ? json_decode($value, true) ?: [] : []; }
    private function requireUser(Request $request): User { $user = $request->user(); abort_unless($user instanceof User, 401, 'Please sign in to continue.'); return $user; }
    private function requireVerifiedUser(Request $request): User { $user = $this->requireUser($request); abort_unless($user->hasVerifiedEmail(), 403, 'Verify your email before placing an order.'); return $user; }
    private function requireAdmin(Request $request): void { $user = $this->requireUser($request); abort_unless($user->role === 'admin', 403, 'Administrator authorization is required.'); }
    private function productRow(object $row): array { return ['id' => $row->id, 'name' => $row->name, 'brand' => $row->brand, 'price' => (float) $row->price, 'compareAt' => $row->compareAt ? (float) $row->compareAt : null, 'categoryId' => $row->categoryId, 'image' => $row->image, 'gallery' => $this->decode($row->gallery), 'description' => $row->description, 'features' => $this->decode($row->features), 'stock' => (int) $row->stock, 'colors' => $this->decode($row->colors), 'featured' => (bool) $row->featured, 'deal' => (bool) $row->deal]; }
    private function couponRow(object $row): array { return ['id' => $row->id, 'code' => $row->code, 'type' => $row->type, 'value' => (float) $row->value, 'minSpend' => (float) $row->minSpend, 'maxDiscount' => $row->maxDiscount ? (float) $row->maxDiscount : null, 'usageLimit' => (int) $row->usageLimit, 'uses' => (int) $row->uses, 'expiresAt' => (string) $row->expiresAt, 'active' => (bool) $row->active, 'categoryIds' => $this->decode($row->categoryIds)]; }
    private function orderRow(object $row): array { return ['id' => $row->id, 'createdAt' => (string) $row->createdAt, 'status' => $row->status, 'customerName' => $row->customerName, 'customerEmail' => $row->customerEmail, 'address' => $row->address, 'subtotal' => (float) $row->subtotal, 'discount' => (float) $row->discount, 'shipping' => (float) $row->shipping, 'total' => (float) $row->total, 'couponCode' => $row->couponCode, 'lines' => DB::table('kitchen_order_lines')->where('orderId', $row->id)->get()->map(fn ($line) => ['productId' => $line->productId, 'color' => $line->color, 'quantity' => (int) $line->quantity, 'name' => $line->name, 'price' => (float) $line->price, 'image' => $line->image])->all()]; }
    private function messageRow(object $row): array { return ['id' => $row->id, 'orderId' => $row->orderId, 'sender' => $row->sender, 'body' => $row->body, 'createdAt' => (string) $row->createdAt]; }
    private function notificationRow(object $row): array { return ['id' => $row->id, 'audience' => $row->audience, 'title' => $row->title, 'body' => $row->body, 'orderId' => $row->orderId, 'createdAt' => (string) $row->createdAt, 'read' => (bool) $row->read]; }
    private function notify(string $audience, string $title, string $body, ?string $orderId = null): void { $userId = $audience === 'customer' && $orderId ? DB::table('kitchen_orders')->where('id', $orderId)->value('user_id') : null; DB::table('kitchen_notifications')->insert(['id' => 'note-'.Str::uuid(), 'audience' => $audience, 'user_id' => $userId, 'title' => $title, 'body' => $body, 'orderId' => $orderId, 'createdAt' => now(), 'read' => false]); }
}
