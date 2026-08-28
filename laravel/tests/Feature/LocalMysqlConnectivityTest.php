<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use PDO;

class LocalMysqlConnectivityTest extends TestCase
{
    /**
     * Verify that the provided local MySQL credentials can establish a connection.
     * This test is intended to be run manually in the sandbox to validate user secrets.
     */
    public function test_local_mysql_connectivity(): void
    {
        $host = env('LOCAL_MYSQL_HOST');
        $port = env('LOCAL_MYSQL_PORT', '3306');
        $database = env('LOCAL_MYSQL_DATABASE');
        $username = env('LOCAL_MYSQL_USERNAME');
        $password = env('LOCAL_MYSQL_PASSWORD');

        if (!$host || !$database || !$username) {
            $this->markTestSkipped('Local MySQL credentials not provided.');
        }

        try {
            // Attempt to connect using raw PDO to avoid Laravel's pre-configured connections
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ];
            
            $pdo = new PDO($dsn, $username, $password, $options);
            
            // Verify connection by running a simple query
            $result = $pdo->query("SELECT 1")->fetchColumn();
            
            $this->assertEquals(1, $result, 'Database connection established but query failed.');
        } catch (\PDOException $e) {
            $this->fail('Failed to connect to local MySQL: ' . $e->getMessage());
        }
    }
}
