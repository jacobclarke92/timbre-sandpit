<?php
namespace App\Model\Table;
use Cake\Database\Schema\Table as Schema;

class ChordsTable extends \Cake\ORM\Table
{
	protected function _initializeSchema(Schema $schema)
    {
        $schema->columnType('response', 'json');
        $schema->columnType('created', 'datetime');
        return $schema;
    }
}