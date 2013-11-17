<?php

// Set stuff up
header("Content-Type: application/json");

$logs = array();

function jsondie($output, $debug = null) {
    global $logs;
    if ($debug) {
        $output["_debug"] = $debug;
    }
    if (count($logs)) {
        $output["_logs"] = $logs;
    }
    die(json_encode($output, JSON_PRETTY_PRINT));
}

function debugLog($message, $debug = null) {
    global $logs;
    
    $log = array("message" => $message);
    if ($debug) {
        $log["_debug"] = $debug;
    }
    
    $logs[] = $log;
}

$couchdb = json_decode(file_get_contents(__DIR__ . "/../../conf/couchdb.json"), true);
$settingshost = gethostname();

if (!isset($couchdb[$settingshost])) {
    $settingshost = "default";
}

$couchdbsettings = $couchdb[$settingshost];
include_once './CouchUser.php';
$CouchUser = new CouchUser($couchdbsettings["url"], $couchdbsettings["adminuser"], $couchdbsettings["adminpass"]);
$CouchUser->becomeNobody();

// Check if can access _config/admins
$admins = $CouchUser->doGet("_config/admins");
if ($admins["response"]["status"]["status"] > 299) {
    $CouchUser->becomeAdmin();
    $admins = $CouchUser->doGet("_config/admins");
    if ($admins["response"]["status"]["status"] > 299) {
        jsondie(array("message" => "Couldn't get _config/admins"), $admins);
    }
}

// Ensure admin user exists
if (!isset($admins["response"]["body"][$couchdbsettings["adminuser"]])) {
    $response = $CouchUser->doPut("_config/admins/" . $couchdbsettings["adminuser"], $couchdbsettings["adminpass"]);
    if (!$response["response"]["status"]["status"] > 299) {
        jsondie("ERROR creating missing adminuser", $repsonse);
    }
    debugLog("created missing adminuser", $response);
} else {
    debugLog("SKIPPED creating adminuser as already present", $admins);
}

$CouchUser->becomeAdmin();

// Ensure expected databases
$databases = $CouchUser->doGet("_all_dbs");
foreach ($couchdbsettings["databases"] as $database) {
    if (!in_array($database, $databases["response"]["body"])) {
        debugLog("created database '" . $database . "'", $CouchUser->doPut($database, null));
    } else {
        debugLog("SKIPPED creating database '" . $database . "' as already present", $databases);
    }
    $securityResponse = $CouchUser->doGet($database . "/_security");
    $security = $securityResponse["response"]["body"];
    if (!isset($security["admins"])) {
        $security["admins"] = array();
    }
    if (!isset($security["admins"]["names"])) {
        $security["admins"]["names"] = array();
    }
    if (!isset($security["admins"]["roles"])) {
        $security["admins"]["roles"] = array();
    }
    if (!isset($security["members"])) {
        $security["members"] = array();
    }
    if (!isset($security["members"]["names"])) {
        $security["members"]["names"] = array();
    }
    if (!isset($security["members"]["roles"])) {
        $security["members"]["roles"] = array();
    }
    if (!in_array("+admin", $security["admins"]["roles"])) {
        $security["admins"]["roles"][] = "+admin";
        debugLog("added '+admin' to _security/admins/roles on db '" . $database . "'");
    } else {
        debugLog("SKIPPED adding '+admin' to _security/admins/roles on db '" . $database . "' as already present");
    }
    
    debugLog("Updating _security on '" . $database . "'", $CouchUser->doPut($database . "/_security", $security));
}

// Ensure increased cookie timeout 604800
debugLog("set cookie timeout to a week", $CouchUser->doPut("_config/couch_httpd_auth/timeout", "604800"));

// Ensure delayed_commits disabled
debugLog("disabled delayed_commits", $CouchUser->doPut("_config/couchdb/delayed_commits", "false"));

// OK, done :3
jsondie(array("ok" => true));