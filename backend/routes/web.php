<?php

use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

Route::get('/csrf-token', [ShopController::class, 'csrfToken']);
Route::get('/api/products', [ShopController::class, 'products']);
Route::get('/api/account', [ShopController::class, 'account']);
Route::post('/api/account', [ShopController::class, 'authenticate'])->middleware('throttle:account-auth');
Route::post('/api/logout', [ShopController::class, 'logout']);
Route::get('/api/account/orders', [ShopController::class, 'customerOrders']);
Route::post('/api/orders', [ShopController::class, 'placeOrder']);
Route::post('/api/contact', [ShopController::class, 'contact']);
Route::get('/api/owner/status', [ShopController::class, 'ownerStatus']);
Route::post('/api/owner/login', [ShopController::class, 'ownerAuthenticate'])->middleware('throttle:owner-auth');
Route::post('/api/owner/logout', [ShopController::class, 'ownerLogout'])->middleware('owner');
Route::get('/api/owner/data', [ShopController::class, 'ownerData'])->middleware('owner');
Route::get('/api/owner/products', [ShopController::class, 'ownerProducts'])->middleware('owner');
Route::post('/api/owner/products', [ShopController::class, 'storeOwnerProduct'])->middleware('owner');
Route::put('/api/owner/products/{product}', [ShopController::class, 'updateOwnerProduct'])->middleware('owner');
Route::delete('/api/owner/products/{product}', [ShopController::class, 'deleteOwnerProduct'])->middleware('owner');

Route::get('/owner-login.html', function () {
    return response()->file(resource_path('owner-pages/owner-login.html'));
});
Route::get('/owner-dashboard.html', function () {
    return response()->file(resource_path('owner-pages/owner-dashboard.html'));
})->middleware('owner');
Route::get('/owner-customers.html', function () {
    return response()->file(resource_path('owner-pages/owner-customers.html'));
})->middleware('owner');
Route::get('/owner-analytics.html', function () {
    return response()->file(resource_path('owner-pages/owner-analytics.html'));
})->middleware('owner');
Route::get('/owner-products.html', function () {
    return response()->file(resource_path('owner-pages/owner-products.html'));
})->middleware('owner');
