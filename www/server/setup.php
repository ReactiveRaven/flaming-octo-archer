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
    if ($response["response"]["status"]["status"] > 299) {
        jsondie("ERROR creating missing adminuser", $repsonse);
    }
    debugLog("created missing adminuser", $response);
} else {
    debugLog("SKIPPED creating adminuser as already present");
}

$CouchUser->becomeAdmin();

// Ensure expected databases
$databases = $CouchUser->doGet("_all_dbs");
foreach ($couchdbsettings["databases"] as $database) {
    if (!in_array($database, $databases["response"]["body"])) {
        debugLog("created database '" . $database . "'", $CouchUser->doPut($database, null));
    } else {
        debugLog("SKIPPED creating database '" . $database . "' as already present");
    }
    $dirty = false;
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
        $dirty = true;
    } else {
        debugLog("SKIPPED adding '+admin' to _security/admins/roles on db '" . $database . "' as already present");
    }
    
    if ($dirty) {
      debugLog("Updating _security on '" . $database . "'", $CouchUser->doPut($database . "/_security", $security));
    } else {
      debugLog("SKIPPED updating _security on '" . $database . "'");
    }
}

// Ensure replication setup into public
foreach (array("validation_global", "validation_users") as $database) {
  $path = "_replicator/" . $couchdbsettings["databases"]["public"] . "__<-__" . $couchdbsettings["databases"][$database];
  $replications = $CouchUser->doGet($path);
  if ($replications["response"]["status"]["status"] > 299) {
    $doc = array(
      "source" => $couchdbsettings["databases"][$database],
      "target" => $couchdbsettings["databases"]["public"],
      "continuous" => true,
      "user_ctx" => array(
        "name" => $couchdbsettings["adminuser"],
        "roles" => array("_admin")
      )
    );
    $response = $CouchUser->doPut($path, $doc);
    if ($response["response"]["status"]["status"] > 299) {
      jsondie(array("message" => "Couldn't replicate '" . $couchdbsettings["databases"][$database] . "' into '" . $couchdbsettings["databases"]["public"] . "'"), $response);
    }
    debugLog("Created replication '" . $couchdbsettings["databases"][$database] . "' into '" . $couchdbsettings["databases"]["public"] . "'", $response);
  } else {
    debugLog("SKIPPED creating replication '" . $couchdbsettings["databases"][$database] . "' into '" . $couchdbsettings["databases"]["public"] . "' as already present");
  }
}

// Ensure increased cookie timeout 604800
$timeout = $CouchUser->doGet("_config/couch_httpd_auth/timeout");
if ($timeout["response"]["body"] !== "604800") {
  debugLog("set cookie timeout to a week", $CouchUser->doPut("_config/couch_httpd_auth/timeout", "604800"));
} else {
  debugLog("SKIPPED setting cookie timeout to a week as already set");
}

// Ensure delayed_commits disabled
$delayed = $CouchUser->doGet("_config/couchdb/delayed_commits");
if ($delayed["response"]["body"] !== "false") {
  debugLog("disabled delayed_commits", $CouchUser->doPut("_config/couchdb/delayed_commits", "false"));
} else {
  debugLog("SKIPPED disabling delayed_commits as already set");
}

// OK, done :3
jsondie(array("ok" => true));