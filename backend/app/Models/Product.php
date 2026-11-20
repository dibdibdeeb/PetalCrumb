<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'category', 'category_label', 'description', 'price',
        'tag', 'image', 'image_alt', 'ingredients', 'allergens', 'active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'ingredients' => 'array',
            'active' => 'boolean',
        ];
    }
}
