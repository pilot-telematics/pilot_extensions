<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 5432,
        'name' => 'comm',
        'user' => 'comm',
        'pass' => 'comm#123',
        'sslmode' => 'prefer',
    ],
    'security' => [
        'token_ttl_seconds' => 86400,
    ],
    'cors' => [
        'allow_origin' => 'https://ext.pilot.tm',
    ],
];
