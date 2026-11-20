<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_read_owner_data(): void
    {
        $this->getJson('/api/owner/data')->assertUnauthorized();
        $this->getJson('/api/owner/products')->assertUnauthorized();
        $this->get('/owner-dashboard.html')->assertRedirect('/owner-login.html');
        $this->get('/owner-products.html')->assertRedirect('/owner-login.html');
        $this->postJson('/api/owner/products', [])->assertUnauthorized();
    }

    public function test_only_owner_can_read_owner_data(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->getJson('/api/owner/data')->assertUnauthorized();
        $this->actingAs($owner)->getJson('/api/owner/data')
            ->assertOk()
            ->assertJsonStructure(['owner', 'customers', 'orders', 'months', 'products']);
    }

    public function test_owner_can_create_edit_and_remove_menu_products(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $product = [
            'name' => 'Cherry tart',
            'category' => 'tarts',
            'description' => 'A bright cherry tart.',
            'price' => '24.50',
            'tag' => 'Seasonal',
            'image' => 'https://example.test/cherry-tart.jpg',
            'image_alt' => 'A cherry tart with cream.',
            'ingredients' => ['Cherries', 'Wheat flour', 'Cream'],
            'allergens' => 'Wheat and dairy',
            'active' => true,
        ];

        $created = $this->actingAs($owner)->postJson('/api/owner/products', $product)
            ->assertCreated()
            ->assertJsonPath('id', 'cherry-tart')
            ->assertJsonPath('category_label', 'Tarts & slices');
        $productId = $created->json('id');

        $this->putJson("/api/owner/products/{$productId}", [...$product, 'name' => 'Cherry cream tart'])
            ->assertOk()
            ->assertJsonPath('name', 'Cherry cream tart');
        $this->getJson('/api/products')->assertJsonFragment(['id' => $productId]);

        $this->deleteJson("/api/owner/products/{$productId}")
            ->assertOk()
            ->assertJsonPath('message', 'Product removed from the shop. Existing order records are preserved.');
        $this->assertDatabaseHas('products', ['id' => $productId, 'active' => false]);
        $this->getJson('/api/products')->assertJsonMissing(['id' => $productId]);
    }

    public function test_customer_registration_persists_a_hashed_account_and_customer_record(): void
    {
        $this->postJson('/api/account', [
            'mode' => 'register',
            'name' => 'Maya Baker',
            'email' => 'maya@example.test',
            'password' => 'freshbakes123',
        ])->assertCreated()->assertJsonPath('user.email', 'maya@example.test');

        $user = User::query()->where('email', 'maya@example.test')->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertNotSame('freshbakes123', $user->password);
        $this->assertDatabaseHas('customers', ['email' => 'maya@example.test', 'name' => 'Maya Baker']);
    }

    public function test_guest_checkout_persists_customer_order_and_server_calculated_total(): void
    {
        Product::query()->create([
            'id' => 'cookie', 'name' => 'Brown butter cookie', 'category' => 'little-bakes',
            'category_label' => 'Little bakes', 'description' => 'A soft cookie.',
            'price' => 8, 'tag' => 'Favourite', 'image' => 'https://example.test/cookie.jpg',
            'image_alt' => 'Cookie', 'ingredients' => ['flour'], 'allergens' => 'Wheat', 'active' => true,
        ]);

        $this->postJson('/api/orders', [
            'name' => 'Maya Baker',
            'email' => 'maya@example.test',
            'date' => now()->addDay()->toDateString(),
            'time' => '10:00–11:00 am',
            'note' => '',
            'items' => [['id' => 'cookie', 'quantity' => 3]],
        ])->assertCreated()->assertJsonPath('total', 24);

        $this->assertDatabaseHas('customers', ['email' => 'maya@example.test', 'name' => 'Maya Baker']);
        $this->assertDatabaseHas('orders', ['total' => '24.00', 'status' => 'Confirmed']);
        $this->assertDatabaseHas('order_items', ['product_id' => 'cookie', 'quantity' => 3, 'line_total' => '24.00']);
    }

    public function test_customer_account_and_order_history_are_scoped_to_signed_in_customer(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'email' => 'customer@example.test']);
        $other = Customer::query()->create([
            'customer_code' => 'PC-4101', 'name' => 'Other Customer', 'email' => 'other@example.test', 'segment' => 'New',
        ]);
        $other->orders()->create([
            'order_code' => 'PC-000001', 'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '10:00–11:00 am', 'total' => 10, 'status' => 'Confirmed',
        ]);

        $this->actingAs($user)->getJson('/api/account/orders')->assertOk()->assertExactJson([]);
    }
}
