<?php
namespace App\Controller\Component;

use Cake\Core\Configure;
use Cake\Network\Http\Client;
use Cake\Controller\Component;
use Cake\Network\Exception\BadRequestException;
use Cake\Network\Exception\UnauthorizedException;

class HooktheoryComponent extends Component
{
	public $components = ['Cookie'];
	public $bearerToken = null;
	private $client = null;
	private $endpoint = null;

	public function initialize(array $config)
	{
		// parent::initialize(array $config);
		$this->Cookie->config([
		    'expires' => '+180 days',
		    'path' => '/'
		]);
		$this->endpoint = Configure::read('App.API.Hooktheory.endpoint');
		$this->client = new Client();

	}

	public function getBearerToken()
	{

		// if already got bearerToken return
		$bearerToken = $this->bearerToken ?: $this->Cookie->read('Hooktheory.bearerToken');
		if($bearerToken) return $bearerToken;

		// fetch api details
    	$username = Configure::read('App.API.Hooktheory.username');
    	$password = Configure::read('App.API.Hooktheory.password');

    	// cofigure app config pls
    	if(!$username || !$password) throw new UnauthorizedException();

    	// make request
    	$response = $this->client->post(
    		$this->endpoint.'users/auth', 
    		['username' => $username, 'password' => $password], 
    		['type' => 'json']
    	);

    	// check response code
    	if($response->code < 200 || $response->code > 300) throw new UnauthorizedException();

    	// check that response contains bearerToken
    	if(!isset($response->json->activkey)) throw new UnauthorizedException();

    	// store and return bearer token
    	$this->bearerToken = $response->json->activkey;
    	$this->Cookie->write('Hooktheory.bearerToken', $this->bearerToken);

    	return $this->bearerToken;
	}

	public function getChordTrends($path)
	{
		if(!$path) throw new BadRequestException();
		$bearerToken = self::getBearerToken();

		$response = $this->client->get(
			$this->endpoint.'trends/nodes',
			['cp' => $path],
			['type' => 'json', 'headers' => ['Authorization' => 'Bearer '.$bearerToken]]
		);

		// check response code
    	if($response->code < 200 || $response->code > 300) throw new UnauthorizedException();

    	return $response->json;
	}
}