import $ from 'jquery'
import axios from 'axios'
import store from 'store2'
import _get from 'lodash/get'

$(document).ready(() => {

	$('[data-app]').hide();

	const bearerToken = store('bearerToken');
	if(bearerToken) initApp(bearerToken);

	$('[data-login-form]').on('submit', function(event) {
		event.preventDefault();
		getBearerToken($(this).serialize(), initApp);
	});

	$('[data-chord-form]').on('submit', function(event) {
		event.preventDefault();
		getChords($(this).serialize(), data => {
			console.log(data);
			$('[data-chord-results]').append(data.map(chord => chord.chord_ID)+'<br />');
		})
	});

	$('[data-logout]').on('click', () => {
		store(false);
		$('[data-app]').hide();
		$('[data-login]').show();
	});

});

function initApp() {
	const bearerToken = store('bearerToken');
	$('[data-login]').hide();
	$('[data-app]').show();
	$('[data-user-message]').html('Welcome back, '+store('username')+'<br /><span class="text-small">Bearer token: '+bearerToken+'</span>');
	// getResource('trends/nodes', {}, data => console.log(data));
}

function getChords(params, callback) {
	$('[data-chord-message]').html('Loading...');
	const bearerToken = store('bearerToken') || '';
	axios({
		method: 'post',
		url: 'server.php?task=chords&bearerToken='+bearerToken,
		data: params,//$.param(params),
	}).then(response => {
		$('[data-chord-message]').html('');
		callback(response.data);
	}).catch(error => {
		$('[data-chord-message]').html('Error getting chords');
	});
}

function getResource(path, params, callback) {
	const bearerToken = store('bearerToken') || '';
	axios({
		method: 'post',
		url: 'server.php?task=get&path='+path+'&bearerToken='+bearerToken,
		data: $.param(params),
	}).then(response => {
		callback(response.data);
	});
}

function getBearerToken(login, callback) {
	axios({
		method: 'post',
		url: 'server.php?task=login',
		data: login,
	}).then(response => {
		const userId = _get(response, 'data.id');
		const username = _get(response, 'data.username');
		const bearerToken = _get(response, 'data.activkey');
		const message = _get(response, 'data.message', '');
		if(bearerToken) {
			store({userId, username, bearerToken});
			callback(bearerToken);
		}else{
			$('[data-login-message]').html('Authorization failed.<br />'+message);
		}
	}).catch(error => {
		console.warn(error);
	});
}