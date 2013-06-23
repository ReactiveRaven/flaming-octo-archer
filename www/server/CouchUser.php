<?php

class CouchUser
{
    private $adminusername = null;
    private $adminpassword = null;
    
    private $userUsername = null;
    private $userPassword = null;
    
    private $currentUsername = null;
    private $currentPassword = null;
    private $currentHost = null;
    
    public function __construct($currentHost, $adminusername, $adminpassword) {
        $this->adminusername = $adminusername;
        $this->adminpassword = $adminpassword;
        $this->currentHost = $currentHost;
        $this->currentUsername = $this->adminusername;
        $this->currentPassword = $this->adminpassword;
    }
    
    public function becomeAdmin()
    {
        $this->currentUsername = $this->adminusername;
        $this->currentPassword = $this->adminpassword;
        return $this;
    }
    
    public function becomeUser()
    {
        $this->currentPassword = $this->userPassword;
        $this->currentUsername = $this->userUsername;
        return $this;
    }
    
    public function setUser($username, $password)
    {
        $this->userUsername = $username;
        $this->userPassword = $password;
        return $this;
    }
    
    public function doGet($url, $headers = array()) 
    {
        $ch = $this->buildCurl($url, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET"); // GET/POST/PUT etc
        //curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
        
        return 
            array(
                "request" => array(
                    "url" => $this->buildUrl($url),
                    "method" => "GET",
                ),
                "response" => $this->parseResponse(curl_exec($ch))
            )
        ;
    }
    
    public function doPost($url, $body, $headers = array()) 
    {
        $ch = $this->buildCurl($url, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST"); // GET/POST/PUT etc
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        
        return 
            array(
                "request" => array(
                    "url" => $this->buildUrl($url),
                    "method" => "POST",
                    "body" => $body,
                ),
                "response" => $this->parseResponse(curl_exec($ch))
            )
        ;
    }
    
    public function doPut($url, $body, $headers = array()) 
    {
        $ch = $this->buildCurl($url, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT"); // GET/POST/PUT etc
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        
        return 
            array(
                "request" => array(
                    "url" => $this->buildUrl($url),
                    "method" => "PUT",
                    "body" => $body,
                ),
                "response" => $this->parseResponse(curl_exec($ch))
            )
        ;
    }
    
    public function doDelete($url, $headers = array()) 
    {
        $ch = $this->buildCurl($url, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE"); // GET/POST/PUT etc
        //curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        
        return 
            array(
                "request" => array(
                    "url" => $this->buildUrl($url),
                    "method" => "DELETE",
                ),
                "response" => $this->parseResponse(curl_exec($ch))
            )
        ;
    }
    
    private function buildCurl($url, $headers) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->buildUrl($url));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, 
            array_merge(
                array(
                    "Content-Type: application/json" // because it is...
                ),
                $headers
            )
        );
        
        return $ch;
    }
    
    private function buildUrl($url) {
        return "http://" . $this->currentUsername . ":" . $this->currentPassword . "@" . $this->currentHost . "/" . ltrim($url, "/");
    }
    
    private function parseResponse($response) {
        
        $responsebits = explode( // explode on \n\n
            "\n\n",
            str_replace( // Make any lingering \r be \n
                "\r", 
                "\n", 
                str_replace( // Make \r\n be \n
                    "\r\n", 
                    "\n", 
                    str_replace( // Make \r\n and \n\r the same
                            "\n\r", 
                            "\r\n", 
                            $response
                    )
                )
            )
        );
        
        $parsedHeaders = array();
        $parsedStatus = false;
        $parsedGarbage = array();
        
        foreach (explode("\n", array_shift($responsebits)) as $header) {
            $matches = array();
            if (preg_match("/^(?P<header>.+?): (?P<value>.+)$/", $header, $matches)) {
                $parsedHeaders[$matches["header"]] = $matches["value"];
            } else if (preg_match("/^HTTP\/(?P<version>[0-9.]+) (?P<status>[0-9]+) (?P<message>.+)$/", $header, $matches)) {
                $parsedStatus = array_intersect_key($matches, array_flip(array("version", "status", "message")));
            } else {
                $parsedGarbage[] = $header;
            }
        }
        
        $parsedBody = json_decode(implode("\n\n", $responsebits), true);
        
        return
            array(
                "status" => $parsedStatus,
                "headers" => $parsedHeaders,
                "body" => $parsedBody,
                "garbage" => $parsedGarbage
            )
        ;
    }
}