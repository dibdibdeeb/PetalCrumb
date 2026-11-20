<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['chocolate-cloud', 'Chocolate cloud cake', 'cakes', 'Celebration cakes', 'Dark cocoa sponge, velvet cream, and a tender chocolate ganache.', 98, 'A little favourite', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 'Rich chocolate celebration cake with swirls of frosting', ['Dark cocoa', 'wheat flour', 'eggs', 'butter', 'cream', 'dark chocolate', 'sugar'], 'Wheat, eggs, and dairy'],
            ['lemon-meringue', 'Lemon meringue tart', 'tarts', 'Tarts & slices', 'Bright lemon curd tucked beneath a cloud of toasted meringue.', 18, 'Bright & lovely', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80', 'Golden lemon tart finished with a soft meringue topping', ['Lemon', 'eggs', 'butter', 'sugar', 'wheat flour', 'almond flour'], 'Wheat, eggs, dairy, and almonds'],
            ['pistachio-croissant', 'Pistachio cream croissant', 'little-bakes', 'Little bakes', 'Flaky, buttery layers with a generous pistachio heart.', 14, 'Morning magic', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 'Freshly baked golden croissants', ['Wheat flour', 'butter', 'milk', 'eggs', 'pistachio', 'yeast', 'sugar'], 'Wheat, dairy, eggs, and pistachio'],
            ['chocolate-hazelnut', 'Chocolate hazelnut slice', 'tarts', 'Tarts & slices', 'Deep cocoa, a little crunch, and silky roasted hazelnut.', 19, 'For chocolate people', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 'Chocolate dessert squares with a rich cocoa finish', ['Dark chocolate', 'wheat flour', 'eggs', 'butter', 'cream', 'roasted hazelnut'], 'Wheat, eggs, dairy, and hazelnut'],
            ['rose-berry-tart', 'Rose & berry tart', 'seasonal', 'Seasonal', 'A crisp almond shell with berries and the gentlest rose cream.', 21, 'Here for a little while', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', 'A colourful fruit tart topped with fresh berries', ['Almond flour', 'wheat flour', 'butter', 'raspberries', 'strawberries', 'cream', 'rose water'], 'Wheat, dairy, and almonds'],
            ['brown-butter-cookie', 'Brown butter cookie', 'little-bakes', 'Little bakes', 'Crisp around the edges, soft in the middle, gone in a minute.', 8, 'A pocket-sized joy', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80', 'Freshly baked chocolate chip cookies', ['Wheat flour', 'brown butter', 'brown sugar', 'eggs', 'dark chocolate', 'vanilla'], 'Wheat, eggs, and dairy'],
            ['vanilla-bean-cupcake', 'Vanilla bean cupcake', 'little-bakes', 'Little bakes', 'Fluffy vanilla sponge with a swirl of real vanilla buttercream.', 11, 'A classic for a reason', 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80', 'Vanilla cupcakes topped with swirled frosting', ['Wheat flour', 'eggs', 'milk', 'butter', 'vanilla bean', 'sugar'], 'Wheat, eggs, and dairy'],
            ['peach-shortcake', 'Peach garden shortcake', 'seasonal', 'Seasonal', 'Tender shortcake, ripe peaches, and softly whipped cream.', 22, 'Seasonal sunshine', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80', 'A fruit-topped shortcake with layers of cream', ['Peaches', 'wheat flour', 'cream', 'eggs', 'butter', 'sugar'], 'Wheat, eggs, and dairy'],
        ];

        foreach ($products as $product) {
            Product::query()->updateOrCreate(['id' => $product[0]], [
                'name' => $product[1], 'category' => $product[2], 'category_label' => $product[3],
                'description' => $product[4], 'price' => $product[5], 'tag' => $product[6],
                'image' => $product[7], 'image_alt' => $product[8],
                'ingredients' => $product[9], 'allergens' => $product[10], 'active' => true,
            ]);
        }

        if (! app()->isLocal() && ! app()->runningUnitTests()) {
            return;
        }

        User::query()->updateOrCreate(
            ['email' => 'owner@petalandcrumb.example'],
            ['name' => 'Petal & Crumb Owner', 'password' => Hash::make('littlecrumbs26'), 'role' => 'owner'],
        );
        User::query()->updateOrCreate(
            ['email' => 'hello@petalandcrumb.example'],
            ['name' => 'Sweet Friend', 'password' => Hash::make('sweet123'), 'role' => 'customer'],
        );

        $customers = [
            ['PC-4101', 'Hana Lee', 'hana.lee@example.com', 'VIP', '2026-03-14'],
            ['PC-4102', 'Adam Noor', 'adam.noor@example.com', 'Regular', '2026-06-02'],
            ['PC-4103', 'Sara Wong', 'sara.wong@example.com', 'Regular', '2026-08-19'],
            ['PC-4104', 'Daniel Lim', 'daniel.lim@example.com', 'New', '2026-08-25'],
            ['PC-4105', 'Lily Tan', 'lily.tan@example.com', 'VIP', '2026-04-07'],
        ];
        foreach ($customers as [$code, $name, $email, $segment, $joined]) {
            Customer::query()->updateOrCreate(
                ['email' => $email],
                ['customer_code' => $code, 'name' => $name, 'segment' => $segment, 'created_at' => $joined, 'updated_at' => $joined],
            );
        }

        $sampleOrders = [
            ['PC-3018', 'PC-4101', '2026-06-06', 'chocolate-cloud', 1, 98, 'Collected'],
            ['PC-3024', 'PC-4102', '2026-06-22', 'pistachio-croissant', 2, 28, 'Collected'],
            ['PC-3061', 'PC-4103', '2026-07-03', 'lemon-meringue', 1, 18, 'Collected'],
            ['PC-3075', 'PC-4101', '2026-07-17', 'brown-butter-cookie', 4, 32, 'Collected'],
            ['PC-3092', 'PC-4105', '2026-07-24', 'rose-berry-tart', 2, 42, 'Collected'],
            ['PC-3120', 'PC-4102', '2026-08-05', 'pistachio-croissant', 2, 28, 'Collected'],
            ['PC-3151', 'PC-4104', '2026-08-19', 'peach-shortcake', 1, 22, 'Collected'],
            ['PC-3180', 'PC-4105', '2026-09-11', 'chocolate-cloud', 1, 98, 'Collected'],
            ['PC-3197', 'PC-4103', '2026-09-23', 'vanilla-bean-cupcake', 3, 33, 'Collected'],
            ['PC-3228', 'PC-4101', '2026-10-08', 'chocolate-hazelnut', 2, 38, 'Collected'],
            ['PC-3246', 'PC-4104', '2026-10-20', 'brown-butter-cookie', 5, 40, 'Collected'],
            ['PC-3271', 'PC-4102', '2026-11-04', 'pistachio-croissant', 2, 28, 'Ready for pickup'],
            ['PC-3284', 'PC-4103', '2026-11-16', 'lemon-meringue', 2, 36, 'Ready for pickup'],
            ['PC-3290', 'PC-4105', '2026-11-18', 'peach-shortcake', 2, 44, 'Ready for pickup'],
        ];

        foreach ($sampleOrders as [$code, $customerCode, $date, $productId, $quantity, $total, $status]) {
            $customer = Customer::query()->where('customer_code', $customerCode)->firstOrFail();
            $order = Order::query()->updateOrCreate(
                ['order_code' => $code],
                ['customer_id' => $customer->id, 'pickup_date' => $date, 'pickup_time' => '10:00–11:00 am', 'total' => $total, 'status' => $status, 'created_at' => $date, 'updated_at' => $date],
            );
            $product = Product::query()->findOrFail($productId);
            $order->items()->delete();
            $order->items()->create([
                'product_id' => $productId, 'product_name' => $product->name,
                'unit_price' => $product->price, 'quantity' => $quantity,
                'line_total' => $total,
            ]);
        }
    }
}
