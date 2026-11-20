<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('category');
            $table->string('category_label');
            $table->text('description');
            $table->decimal('price', 8, 2);
            $table->string('tag');
            $table->string('rating', 8);
            $table->text('image');
            $table->string('image_alt');
            $table->json('ingredients');
            $table->string('allergens');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code')->nullable()->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('segment')->default('New');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->nullable()->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->date('pickup_date');
            $table->string('pickup_time', 40);
            $table->text('note')->nullable();
            $table->decimal('total', 10, 2);
            $table->string('status')->default('Confirmed');
            $table->timestamps();
            $table->index(['created_at', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('product_id')->nullable();
            $table->foreign('product_id')->references('id')->on('products')->restrictOnDelete();
            $table->string('product_name');
            $table->decimal('unit_price', 8, 2);
            $table->unsignedSmallInteger('quantity');
            $table->decimal('line_total', 10, 2);
            $table->timestamps();
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('products');
    }
};
