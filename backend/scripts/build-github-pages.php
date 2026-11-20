<?php

$backendRoot = dirname(__DIR__);
$projectRoot = dirname($backendRoot);
$publicRoot = $backendRoot.DIRECTORY_SEPARATOR.'public';
$ownerPagesRoot = $backendRoot.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'owner-pages';
$docsRoot = $projectRoot.DIRECTORY_SEPARATOR.'docs';

if (! is_dir($docsRoot) && ! mkdir($docsRoot, 0777, true) && ! is_dir($docsRoot)) {
    throw new RuntimeException('Could not create the docs output directory.');
}

$pages = [
    'index.html' => $publicRoot.DIRECTORY_SEPARATOR.'index.html',
    'menu.html' => $publicRoot.DIRECTORY_SEPARATOR.'menu.html',
    'preorder.html' => $publicRoot.DIRECTORY_SEPARATOR.'preorder.html',
    'login.html' => $publicRoot.DIRECTORY_SEPARATOR.'login.html',
    'dashboard.html' => $publicRoot.DIRECTORY_SEPARATOR.'dashboard.html',
    'story.html' => $publicRoot.DIRECTORY_SEPARATOR.'story.html',
    'owner-login.html' => $ownerPagesRoot.DIRECTORY_SEPARATOR.'owner-login.html',
    'owner-dashboard.html' => $ownerPagesRoot.DIRECTORY_SEPARATOR.'owner-dashboard.html',
    'owner-products.html' => $ownerPagesRoot.DIRECTORY_SEPARATOR.'owner-products.html',
    'owner-customers.html' => $ownerPagesRoot.DIRECTORY_SEPARATOR.'owner-customers.html',
    'owner-analytics.html' => $ownerPagesRoot.DIRECTORY_SEPARATOR.'owner-analytics.html',
];
$scripts = '<script src="assets/js/demo-data.js"></script>'
    .'<script src="assets/js/static-mode.js"></script>'
    .'<script src="assets/js/static-demo.js"></script>'
    .'<script src="assets/js/app.js"></script>';
$replacements = [
    'Seeded demo data and live shop activity' => 'Fictional data · updates stay in this browser',
    'Includes fictional seed data and live orders' => 'Fictional sample records · browser-local',
    'Fictional seed records and live customers' => 'Fictional customer examples · browser-local',
    'Pickup activity from the shop database.' => 'Fictional sample and browser-local pickup activity.',
    'new orders appear here from the database.' => 'new demo orders appear here in this browser.',
    'The customer list is available only to the signed-in shop owner.' => 'This fictional list is shown after the demo sign-in only; it is not private or secure.',
    'This customer list is available only to the signed-in shop owner.' => 'This fictional list is shown after the demo sign-in only; it is not private or secure.',
    'Owner pages and customer data are protected by server-side sign-in.' => 'The client-side demo login is visible in the source and is not secure.',
    'Owner sign-in required' => 'Demo sign-in required',
    'Menu management · owner access only' => 'Menu management · static demo',
    'Customer records · owner access only' => 'Fictional customer records · static demo',
    'Sales insights · owner access only' => 'Fictional sales insights · static demo',
    'Here’s how your neighbourhood is showing up for a little something sweet.' => 'Explore the fictional sample activity for this assessment demo.',
    'A live view of pickup sales, order volume, and what’s coming out of the oven most.' => 'A sample view of pickup sales, order volume, and popular bakes.',
    'Owner workspace · database-backed shop activity' => 'Owner workspace · static demo data',
    'Owner workspace · database-backed customer records' => 'Owner workspace · fictional demo records',
    'Owner workspace · database-backed analytics' => 'Owner workspace · fictional demo analytics',
    'Owner workspace · database-backed menu products' => 'Owner workspace · browser-local demo menu',
    'Seeded sample orders are fictional; new orders appear here from the database.' => 'Sample orders are fictional; new demo orders are stored only in this browser.',
];

foreach ($pages as $destinationName => $source) {
    $contents = file_get_contents($source);
    if ($contents === false) {
        throw new RuntimeException("Could not read the page source: {$source}");
    }

    $appScript = '<script src="assets/js/app.js"></script>';
    if (substr_count($contents, $appScript) !== 1) {
        throw new RuntimeException("Expected one app script in {$destinationName}.");
    }
    $contents = str_replace($appScript, $scripts, $contents);
    $contents = str_replace(array_keys($replacements), array_values($replacements), $contents);

    if (file_put_contents($docsRoot.DIRECTORY_SEPARATOR.$destinationName, $contents) === false) {
        throw new RuntimeException("Could not write {$destinationName}.");
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

$obsoleteProductExport = $docsRoot.DIRECTORY_SEPARATOR.'assets'.DIRECTORY_SEPARATOR.'data'.DIRECTORY_SEPARATOR.'products.json';
if (is_file($obsoleteProductExport) && ! unlink($obsoleteProductExport)) {
    throw new RuntimeException('Could not remove the old database-generated product export.');
}
$obsoleteDataDirectory = dirname($obsoleteProductExport);
if (is_dir($obsoleteDataDirectory) && count(scandir($obsoleteDataDirectory)) === 2) {
    rmdir($obsoleteDataDirectory);
}
if (file_put_contents($docsRoot.DIRECTORY_SEPARATOR.'.nojekyll', '') === false) {
    throw new RuntimeException('Could not write the GitHub Pages marker file.');
}

echo 'GitHub Pages demo built with '.count($pages).' static HTML pages; no database required.'.PHP_EOL;
