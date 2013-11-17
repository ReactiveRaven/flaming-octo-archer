<?php

// Set stuff up
header("Content-Type: application/json");

function jsondie($output, $debug = null) {
    if ($debug) {
        $output["_debug"] = $debug;
    }
    die(json_encode($output, JSON_PRETTY_PRINT));
}

$couchdb = json_decode(file_get_contents(__DIR__ . "/../../conf/couchdb.json"), true);
$settingshost = gethostname();

if (!isset($couchdb[$settingshost])) {
    $settingshost = "default";
}

$couchdbsettings = $couchdb[$settingshost];
include_once './CouchUser.php';
$CouchUser = new CouchUser($couchdbsettings["url"], $couchdbsettings["adminuser"], $couchdbsettings["adminpass"]);

// Get username and password, die on errors
if (!isset($_REQUEST["username"])) {
    jsondie(array("forbidden" => "Must supply a 'username' argument"));
}
$registerUsername = $_REQUEST["username"];
if (!isset($_REQUEST["password"])) {
    jsondie(array("forbidden" => "Must supply a 'password' argument"));
}
$registerPassword = $_REQUEST["password"];
$CouchUser->setUser($registerUsername, $registerPassword);

$checkExistingUser = $CouchUser->becomeAdmin()->doGet("commissar_user_" . $registerUsername);
if ($checkExistingUser["response"]["status"]["status"] != 404) {
    jsondie(array("forbidden" => "User already exists"), $checkExistingUser);
}

// Set up the new user in the users database
$userArray = array(
    "type" => "user",
    "_id" => "org.couchdb.user:" . $registerUsername,
    "name" => $registerUsername,
    "password" => $registerPassword,
    "roles" => array()
);
$createNewUser = $CouchUser->doPut("_users/org.couchdb.user:" . $registerUsername, $userArray);
if ($createNewUser["response"]["status"]["status"] > 299) {
    jsondie(array("error" => "Could not create user"), $createNewUser);
}

// Create the user's personal database
$userDatabaseName = "commissar_user_" . $registerUsername;

$createUserDatabase = $CouchUser->doPut($userDatabaseName, null);

if ($createUserDatabase["response"]["status"]["status"] > 299) {
    jsondie(array("error" => "Could not create user store"), $createUserDatabase);
}

// Set up the security object
$security = array(
    "admins" => array(
        "names" => array(),
        "roles" => array("+admin")
    ),
    "members" => array(
        "names" => array($registerUsername),
        "roles" => array()
    )
);

$createSecurity = $CouchUser->doPut($userDatabaseName . "/_security", $security);

if ($createSecurity["response"]["status"]["status"] > 299) {
    jsondie(array("error" => "Could not secure your user account"), $createSecurity);
}

// Set up replication from global to personal
$globalReplicationArray = array(
    "_id" => "user:" . $registerUsername . "_validation_global",
    "source" => $couchdbsettings["databases"]["validation_global"],
    "target" => $userDatabaseName,
    "continuous" => true,
    "user_ctx" => array(
        "name" => $couchdbsettings["adminuser"],
        "roles" => array("_admin")
    ),
);

$globalValidationReplication = $CouchUser->doPost("_replicator", $globalReplicationArray);

if ($globalValidationReplication["response"]["status"]["status"] > 299) {
    jsondie(array("error" => "Global validation not applied"), $globalValidationReplication);
}

// Set up replication from users to personal
$userReplicationArray = array(
    "_id" => "user:" . $registerUsername . "_validation_users",
    "source" => $couchdbsettings["databases"]["validation_users"],
    "target" => $userDatabaseName,
    "continuous" => true,
    "user_ctx" => array(
        "name" => $couchdbsettings["adminuser"],
        "roles" => array("_admin")
    ),
);

$userValidationReplication = $CouchUser->doPost("_replicator", $userReplicationArray);

if ($userValidationReplication["response"]["status"]["status"] > 299) {
    jsondie(array("error" => "User validation not applied"), $userValidationReplication);
}

// OK, done :3
jsondie(array("ok" => true));