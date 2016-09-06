<?php

namespace App\Utility;

use Cake\Controller\Component;
use Cake\Controller\ComponentRegistry;

use Cake\Core\Configure;
use Cake\Network\Http\Client;
use Cake\Network\Exception\UnauthorizedException;

class Hooktheory extends Component {

	public $controller = null;
    public $session = null;

	private $client = null;
	private $bearerToken = null;

	public function initialize()
    {
        parent::initialize();

        $this->controller = $this->_registry->getController();
        $this->session = $this->controller->request->session();
        
        $this->client = new Client();

        $bearerToken = $this->session->read('Hooktheory.bearerToken', ['defaults' => 'php']);
        if($bearerToken) {
        	pr('Already got bearer token!');
        	$this->bearerToken = $bearerToken;
        }else{
        	pr('Fetching bearer token!');
        	self::getBearerToken();
        }

    	pr($this->session->read('Hooktheory.bearerToken'));

		pr('OKEP');

		exit;
    }

    private function getBearerToken()
    {

    	$endpoint = $this->session->read('App.API.Hooktheory.endpoint');
    	$username = $this->session->read('App.API.Hooktheory.username');
    	$password = $this->session->read('App.API.Hooktheory.password');

    	if(!$username || !$password) throw new UnauthorizedException();

    	$response = $this->client->post(
    		$endpoint.'users/auth', 
    		['username' => $username, 'password' => $password], 
    		['type' => 'json']
    	);

    	if($response->code < 200 || $response->code > 300) throw new UnauthorizedException();
    	$response = json_decode($response->body);

    	if(!isset($response->activkey)) throw new UnauthorizedException();

    	$this->bearerToken = $response->activkey;
    	$this->session->write('Hooktheory.bearerToken', $this->bearerToken, ['defaults' => 'php']);

    }

}