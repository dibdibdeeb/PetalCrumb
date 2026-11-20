<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ShopController extends Controller
{
    public function products(): JsonResponse
    {
        return response()->json(Product::query()->where('active', true)->orderBy('name')->get());
    }

    public function csrfToken(Request $request): JsonResponse
    {
        return response()->json(['token' => $request->session()->token()]);
    }

    public function ownerStatus(Request $request): JsonResponse
    {
        return response()->json([
            'authenticated' => $request->user()?->isOwner() ?? false,
        ]);
    }

    public function account(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user && $user->role === 'customer'
                ? ['name' => $user->name, 'email' => $user->email]
                : null,
        ]);
    }

    public function authenticate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mode' => ['required', 'in:login,register'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'name' => ['required_if:mode,register', 'nullable', 'string', 'min:2', 'max:120'],
        ]);

        if ($data['mode'] === 'login') {
            if (! Auth::attempt([
                'email' => strtolower($data['email']),
                'password' => $data['password'],
                'role' => 'customer',
            ])) {
                throw ValidationException::withMessages([
                    'email' => ['That email and password don’t look quite right. Please try again.'],
                ]);
            }

            $request->session()->regenerate();
            $user = $request->user();

            return response()->json(['user' => ['name' => $user->name, 'email' => $user->email]]);
        }

        $email = strtolower($data['email']);
        if (User::query()->where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['An account with that email already exists. Please sign in instead.'],
            ]);
        }

        $user = DB::transaction(function () use ($data, $email) {
            $customer = Customer::query()->firstOrCreate(
                ['email' => $email],
                ['name' => trim($data['name']), 'segment' => 'New'],
            );
            $this->ensureCustomerCode($customer);

            return User::query()->create([
                'name' => trim($data['name']),
                'email' => $email,
                'password' => Hash::make($data['password']),
                'role' => 'customer',
            ]);
        });

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => ['name' => $user->name, 'email' => $user->email]], 201);
    }

    public function ownerAuthenticate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        if (! Auth::attempt([
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => 'owner',
        ])) {
            throw ValidationException::withMessages([
                'email' => ['Those owner details don’t match. Please try again.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(['owner' => ['name' => $request->user()->name]]);
    }

    public function ownerLogout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    public function customerOrders(Request $request): JsonResponse
    {
        abort_unless($request->user() && $request->user()->role === 'customer', 401);

        $customer = Customer::query()->where('email', $request->user()->email)->first();
        $orders = $customer
            ? $customer->orders()->with('items')->latest()->get()
            : collect();

        return response()->json($orders->map(fn (Order $order) => $this->formatOrder($order)));
    }

    public function placeOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'time' => ['required', 'string', 'max:40'],
            'note' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.id' => ['required', 'string', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $user = $request->user();
        if ($user && $user->role === 'customer') {
            $data['name'] = $user->name;
            $data['email'] = $user->email;
        }

        $order = DB::transaction(function () use ($data) {
            $customer = Customer::query()->firstOrCreate(
                ['email' => strtolower($data['email'])],
                ['name' => trim($data['name']), 'segment' => 'New'],
            );
            $this->ensureCustomerCode($customer);

            $items = [];
            $total = 0;
            foreach ($data['items'] as $item) {
                $product = Product::query()->where('active', true)->findOrFail($item['id']);
                $lineTotal = (int) round(((float) $product->price) * 100) * $item['quantity'];
                $total += $lineTotal;
                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $product->price,
                    'quantity' => $item['quantity'],
                    'line_total' => number_format($lineTotal / 100, 2, '.', ''),
                ];
            }

            $order = $customer->orders()->create([
                'pickup_date' => $data['date'],
                'pickup_time' => $data['time'],
                'note' => $data['note'] ?? null,
                'total' => number_format($total / 100, 2, '.', ''),
                'status' => 'Confirmed',
            ]);
            $order->update(['order_code' => 'PC-'.str_pad((string) $order->id, 6, '0', STR_PAD_LEFT)]);
            $order->items()->createMany($items);

            return $order->load('items');
        });

        return response()->json($this->formatOrder($order), 201);
    }

    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'min:8', 'max:3000'],
        ]);

        ContactMessage::query()->create($data);

        return response()->json(['message' => 'Thanks for reaching out. We’ll be in touch soon.'], 201);
    }

    public function ownerData(): JsonResponse
    {
        $customers = Customer::query()->with(['orders.items'])->get();
        $orders = Order::query()->with(['customer', 'items'])->orderBy('created_at')->get();

        $customerRows = $customers->map(function (Customer $customer) {
            $orders = $customer->orders;
            $favourite = $orders->flatMap->items
                ->groupBy('product_name')
                ->map(fn ($items) => $items->sum('quantity'))
                ->sortDesc()
                ->keys()
                ->first() ?? 'No orders yet';

            return [
                'id' => $customer->customer_code,
                'name' => $customer->name,
                'email' => $customer->email,
                'joined' => $customer->created_at->toDateString(),
                'favourite' => $favourite,
                'segment' => $customer->segment,
                'orderCount' => $orders->count(),
                'spend' => (float) $orders->sum('total'),
                'lastOrder' => $orders->max('created_at')?->toDateString() ?? '',
            ];
        });

        $orderRows = $orders->map(fn (Order $order) => [
            'id' => $order->order_code,
            'customerId' => $order->customer?->customer_code,
            'customer' => $order->customer?->name ?? 'Guest',
            'date' => $order->created_at->toDateString(),
            'productId' => $order->items->first()?->product_id,
            'product' => $order->items->first()?->product_name ?? 'Dessert order',
            'quantity' => $order->items->sum('quantity'),
            'total' => (float) $order->total,
            'status' => $order->status,
        ]);

        $months = $orders->groupBy(fn (Order $order) => $order->created_at->format('Y-m'));
        $monthly = $months->map(fn ($monthOrders, $key) => [
            'key' => $key,
            'label' => Carbon::createFromFormat('Y-m', $key)->format('M'),
            'orders' => $monthOrders->count(),
            'sales' => (float) $monthOrders->sum('total'),
        ])->values();
        $productRows = Product::query()->get()->keyBy('id')->map(fn (Product $product) => [
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category,
            'quantity' => 0,
            'sales' => 0.0,
        ]);
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                if (! $item->product_id || ! $productRows->has($item->product_id)) {
                    continue;
                }
                $row = $productRows->get($item->product_id);
                $row['quantity'] += $item->quantity;
                $row['sales'] += (float) $item->line_total;
                $productRows->put($item->product_id, $row);
            }
        }

        return response()->json([
            'owner' => ['name' => request()->user()->name],
            'customers' => $customerRows,
            'orders' => $orderRows,
            'months' => $monthly,
            'products' => $productRows->values()->filter(fn (array $product) => $product['quantity'] > 0)->values(),
        ]);
    }

    public function ownerProducts(): JsonResponse
    {
        return response()->json(Product::query()->orderBy('name')->get());
    }

    public function storeOwnerProduct(Request $request): JsonResponse
    {
        $data = $this->validateProduct($request);
        $data['id'] = $this->uniqueProductId($data['name']);
        $data['active'] = $data['active'] ?? true;

        return response()->json(Product::query()->create($data), 201);
    }

    public function updateOwnerProduct(Request $request, Product $product): JsonResponse
    {
        $product->update($this->validateProduct($request));

        return response()->json($product->refresh());
    }

    public function deleteOwnerProduct(Product $product): JsonResponse
    {
        $product->update(['active' => false]);

        return response()->json([
            'message' => 'Product removed from the shop. Existing order records are preserved.',
        ]);
    }

    private function validateProduct(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'category' => ['required', 'in:cakes,tarts,little-bakes,seasonal'],
            'description' => ['required', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'gt:0', 'decimal:0,2', 'max:999999.99'],
            'tag' => ['required', 'string', 'max:60'],
            'image' => ['required', 'url:http,https', 'max:2048'],
            'image_alt' => ['required', 'string', 'max:255'],
            'ingredients' => ['required', 'array', 'min:1', 'max:30'],
            'ingredients.*' => ['required', 'string', 'max:100'],
            'allergens' => ['required', 'string', 'max:255'],
            'active' => ['sometimes', 'required', 'boolean'],
        ]);

        $data['category_label'] = [
            'cakes' => 'Celebration cakes',
            'tarts' => 'Tarts & slices',
            'little-bakes' => 'Little bakes',
            'seasonal' => 'Seasonal',
        ][$data['category']];

        return $data;
    }

    private function uniqueProductId(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $id = $base;
        $suffix = 2;

        while (Product::query()->whereKey($id)->exists()) {
            $id = $base.'-'.$suffix++;
        }

        return $id;
    }

    private function ensureCustomerCode(Customer $customer): void
    {
        if (! $customer->customer_code) {
            $customer->update(['customer_code' => 'PC-'.str_pad((string) (4100 + $customer->id), 4, '0', STR_PAD_LEFT)]);
        }
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id' => $order->order_code,
            'createdAt' => $order->created_at->toISOString(),
            'name' => $order->customer?->name,
            'email' => $order->customer?->email,
            'pickupDate' => $order->pickup_date->format('Y-m-d'),
            'pickupTime' => $order->pickup_time,
            'note' => $order->note,
            'items' => $order->items->map(fn (OrderItem $item) => [
                'id' => $item->product_id,
                'name' => $item->product_name,
                'price' => (float) $item->unit_price,
                'quantity' => $item->quantity,
            ]),
            'total' => (float) $order->total,
            'status' => $order->status,
        ];
    }
}
