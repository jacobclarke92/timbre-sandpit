<?php

	$task = isset($_GET['task']) ? $_GET['task'] : null;
	$apiUrl = 'https://api.hooktheory.com/v1/';

	switch ($task) {
		case 'login':
			$username = isset($_POST['username']) ? $_POST['username'] : '';
			$password = isset($_POST['password']) ? $_POST['password'] : '';
			$login = ['username' => $username, 'password' => $password];
			$response = curlPost($apiUrl.'users/auth', $login);
			echo $response;
			break;
		
		case 'get':
			$path = isset($_GET['path']) ? $_GET['path'] : null;
			$bearerToken = isset($_GET['bearerToken']) ? $_GET['bearerToken'] : null;
			if($path) {
				$response = curlGet($apiUrl.$path, [], $bearerToken);
				echo $response;
			}
			break;

		case 'chords':
			$url = $apiUrl.'trends/nodes';
			$bearerToken = isset($_GET['bearerToken']) ? $_GET['bearerToken'] : null;

			$total = isset($_POST['total']) ? $_POST['total'] : 4;
			$cp = isset($_POST['cp']) ? $_POST['cp'] : 1;
			$random = isset($_POST['random']) ? $_POST['random'] : 1;
			
			$chordNumbers = [$cp];
			$chords = [['chord_ID' => $cp]];
			
			for($i = 0; $i < $total-1; $i++) {
				$options = curlGet($url, ['cp' => implode(',', $chordNumbers)], $bearerToken);
				$options = json_decode($options, true);
				// echo "\n---------------------------\n".implode(',', $chordNumbers)."\n";
				// var_dump($options[0]);
				$rand = count($options) < $random ? count($options) : $random;
				$key = rand(0, $rand-1);
				if(isset($options[$key]['chord_ID'])) {
					$chords[] = $options[$key];
					$chordNumbers[] = $options[$key]['chord_ID'];
				}
			}
			echo json_encode($chords);
			break;

		default:
			# code...
			break;
	}

	function curlGet($url, $params = [], $bearerToken = null) {
		$ch = curl_init(); 
		if($bearerToken) curl_setopt($ch, CURLOPT_HTTPHEADER, [
			'Content-Type: application/json',  
			'Authorization: Bearer '.$bearerToken
		]);
		curl_setopt($ch, CURLOPT_URL, $url.'?'.http_build_query($params));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$output = curl_exec($ch);
		curl_close($ch);
		return $output;
	}

	function curlPost($url, $data = [], $bearerToken = null) {
		$ch = curl_init(); 
		if($bearerToken) curl_setopt($ch, CURLOPT_HTTPHEADER, [
			'Content-Type: application/json',  
			'Authorization: Bearer '.$bearerToken
		]);
		curl_setopt($ch, CURLOPT_URL, $url); 
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_POST, count($data));
		curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
		$output = curl_exec($ch);
		curl_close($ch);
		return $output;
	}
?>