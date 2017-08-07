<?php
$servername = "127.0.0.1:3309";
$username = "kurniawan";
$password = "Neon()123";

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 
echo "Connected successfully";
?>