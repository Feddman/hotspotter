<?php
// Save hotspot HTML file to server

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Only POST requests allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['filename']) || !isset($input['content'])) {
    echo json_encode(['success' => false, 'error' => 'Missing filename or content']);
    exit;
}

$filename = $input['filename'];
$content = $input['content'];

// Sanitize filename
$filename = preg_replace('/[^a-z0-9-_.]/i', '-', $filename);
$filename = trim($filename, '-');

if (empty($filename)) {
    $filename = 'hotspot-' . time();
}

// Ensure .html extension
if (!preg_match('/\.html$/i', $filename)) {
    $filename .= '.html';
}

// Create library directory if it doesn't exist
$libraryDir = __DIR__ . '/library';
if (!is_dir($libraryDir)) {
    mkdir($libraryDir, 0755, true);
}

// Full file path
$filePath = $libraryDir . '/' . $filename;

// Check if file already exists
$fileExists = file_exists($filePath);
$overwrite = isset($input['overwrite']) ? (bool)$input['overwrite'] : false;

// If file exists and overwrite not confirmed, return error
if ($fileExists && !$overwrite) {
    echo json_encode([
        'success' => false,
        'error' => 'File already exists',
        'fileExists' => true,
        'filename' => $filename
    ]);
    exit;
}

// Save file
if (file_put_contents($filePath, $content) === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
    exit;
}

// Return success with full document root URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'];
$scriptPath = dirname($_SERVER['SCRIPT_NAME']);
// Ensure we use the full path including the hotspotter directory
$baseUrl = $protocol . $host . $scriptPath;
$fileUrl = $baseUrl . '/library/' . $filename;
echo json_encode([
    'success' => true,
    'filename' => $filename,
    'url' => $fileUrl,
    'path' => 'library/' . $filename,
    'overwritten' => $fileExists
]);
