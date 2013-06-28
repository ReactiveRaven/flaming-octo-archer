<?php

require_once __DIR__.'/../vendor/autoload.php';

$app = new Silex\Application();

// definitions
foreach (glob("../../backend/controllers/*.php") as $filename)
{
    include $filename;
}

$app->run();