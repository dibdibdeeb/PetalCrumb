<?php

use App\Models\Product;
use Illuminate\Contracts\Console\Kernel;

$backendRoot = dirname(__DIR__);
$projectRoot = dirname($backendRoot);
$publicRoot = $backendRoot.DIRECTORY_SEPARATOR.'public';
$docsRoot = $projectRoot.DIRECTORY_SEPARATOR.'docs';

require $backendRoot.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';
$app = require $backendRoot.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

if (! is_dir($docsRoot) && ! mkdir($docsRoot, 0777, true) && ! is_dir($docsRoot)) {
    throw new RuntimeException('Could not create the docs output directory.');
}

$pages = ['index.html', 'menu.html', 'story.html'];
foreach ($pages as $page) {
    $source = $publicRoot.DIRECTORY_SEPARATOR.$page;
    $destination = $docsRoot.DIRECTORY_SEPARATOR.$page;
    $contents = file_get_contents($source);
    $appScript = '<script src="assets/js/app.js"></script>';
    $bootstrapScript = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>';

    if ($contents === false || substr_count($contents, $appScript) !== 1 || substr_count($contents, $bootstrapScript) !== 1) {
        throw new RuntimeException("Could not prepare {$page} for static publishing.");
    }

    $contents = str_replace(
        $bootstrapScript,
        '<script src="assets/js/static-mode.js"></script>'.$bootstrapScript,
        $contents,
    );

    if (file_put_contents($destination, $contents) === false) {
        throw new RuntimeException("Could not write {$page} to the docs directory.");
    }
}

$assetSource = $publicRoot.DIRECTORY_SEPARATOR.'assets';
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($assetSource, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
);

foreach ($iterator as $item) {
    $relativePath = substr($item->getPathname(), strlen($assetSource) + 1);
    $destination = $docsRoot.DIRECTORY_SEPARATOR.'assets'.DIRECTORY_SEPARATOR.$relativePath;

    if ($item->isDir()) {
        if (! is_dir($destination) && ! mkdir($destination, 0777, true) && ! is_dir($destination)) {
            throw new RuntimeException("Could not create assets directory: {$relativePath}");
        }

        continue;
    }

    $destinationDirectory = dirname($destination);
    if (! is_dir($destinationDirectory) && ! mkdir($destinationDirectory, 0777, true) && ! is_dir($destinationDirectory)) {
        throw new RuntimeException("Could not create assets directory: {$relativePath}");
    }
    if (! copy($item->getPathname(), $destination)) {
        throw new RuntimeException("Could not copy asset: {$relativePath}");
    }
}

$products = Product::query()
    ->where('active', true)
    ->orderBy('name')
    ->get()
    ->map(fn (Product $product) => [
        'id' => $product->id,
        'name' => $product->name,
        'category' => $product->category,
        'category_label' => $product->category_label,
        'description' => $product->description,
        'price' => (float) $product->price,
        'tag' => $product->tag,
        'image' => $product->image,
        'image_alt' => $product->image_alt,
        'ingredients' => $product->ingredients,
        'allergens' => $product->allergens,
        'active' => true,
    ])
    ->values()
    ->all();

$dataDirectory = $docsRoot.DIRECTORY_SEPARATOR.'assets'.DIRECTORY_SEPARATOR.'data';
if (! is_dir($dataDirectory) && ! mkdir($dataDirectory, 0777, true) && ! is_dir($dataDirectory)) {
    throw new RuntimeException('Could not create the static product data directory.');
}

$productJson = json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
if (file_put_contents($dataDirectory.DIRECTORY_SEPARATOR.'products.json', $productJson.PHP_EOL) === false) {
    throw new RuntimeException('Could not write the static product data.');
}
if (file_put_contents($docsRoot.DIRECTORY_SEPARATOR.'.nojekyll', '') === false) {
    throw new RuntimeException('Could not write the GitHub Pages marker file.');
}

echo 'GitHub Pages site built with '.count($products).' active products in docs.'.PHP_EOL;
