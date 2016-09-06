<?php

namespace App\Controller;

use Cake\I18n\Time;
use Cake\Core\Configure;
use Cake\Network\Http\Client;
use Cake\Network\Exception\NotFoundException;
use Cake\Network\Exception\BadRequestException;


class ChordsController extends AppController
{	
	public function initialize()
    {
        parent::initialize();
        $this->loadComponent('Hooktheory');
        $this->loadComponent('RequestHandler');
    }

	public function search() 
	{
		// get query vars
		$path = $this->request->query('path');
		if(!$path) throw new BadRequestException();
		$total = $this->request->query('total') ?: 4;
		$total = min(24, $total);
		$random = $this->request->query('random');
		if(!$random && $random !== 0) $random = 1;
		$random = max(0, $random);

		// extract path if more than one starting chord
		$paths = explode(',', $path);
		$existing = count($paths);

		// fill out chords array with existing path
		$chords = [];
		$child_path = '';
		foreach ($paths as $index => $path) {
			$child_path .= ($index == 0 ? $path : ','.$path);
			$chords[] = ['chord_ID' => $path, 'child_path' => $child_path];
		}
		
		// iterate over remaining chords requested
		for($count = $existing; $count < $total; $count++) {

			// check if current chord path has already been cached
			$chordTrends = $this->Chords->findByPath($path)->first();
			if($chordTrends) {
				$chordTrends = $chordTrends->response;

			// otherwise query hooktheory api
			}else {
				$chordTrends = $this->Hooktheory->getChordTrends($path);
				if(count($chordTrends) == 0) break;

				$chordTrendsEntity = $this->Chords->newEntity();
				$chordTrendsEntity->path = $path;
				$chordTrendsEntity->response = $chordTrends;
				$chordTrendsEntity->created = new Time();
				$saved = $this->Chords->save($chordTrendsEntity);
			}

			// randomly select a chord based on query, make sure it's in bounds of response array
			$chord = $chordTrends[$random ? min(count($chordTrends)-1, rand(0, $random)) : 0];

			// add to chords array and update path for next loop iteration
			$chords[] = $chord;
			$path = $chord['child_path'];
		}

		// set response data
		$this->set('data', $chords);
		$this->set('_serialize', ['data']);
	}

}