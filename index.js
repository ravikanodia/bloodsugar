'use strict';

const fs = require('fs');
const ArgumentParser = require('argparse').ArgumentParser; 
const EntityTable = require('./lib/EntityTable');
const _ = require('underscore');

var argParser = new ArgumentParser({
    version: '0.0.0',
    addHelp: true,
    description: 'Track blood sugar based on food and exercise.'
  });
argParser.addArgument(
    ['-f', '--food'],
    {
      help: 'CSV file containing food data (format: $id,$name,$glycemic_index)',
      required: true
    });
argParser.addArgument(
    ['-e', '--exercise'],
    {
      help: 'CSV file containing exercise data (format: $id,$name,$exercise_index)',
      required: true
    });
argParser.addArgument(
    ['-i', '--input'],
    {
      help: 'CSV file containing events (format: $type,$id)',
      required: true
    });

var args = argParser.parseArgs();

// readFileSync is not very node-y, but these files are very small and they
// are required before any work can be done. Async methods are overkill here.
var foodFileBuffer = fs.readFileSync(args.food);
var exerciseFileBuffer = fs.readFileSync(args.exercise);
var inputFileBuffer = fs.readFileSync(args.input);

console.log('food file: ' + foodFileBuffer.toString());
console.log('exercise file: ' + exerciseFileBuffer.toString());
console.log('input file: ' + inputFileBuffer.toString());

var foodEntityTable = EntityTable.FoodTable(foodFileBuffer);
var exerciseEntityTable = EntityTable.ExerciseTable(exerciseFileBuffer);
console.log('food table: ' + foodEntityTable.name);
_.each(foodEntityTable.entities, function(value, key) {
  console.log(value.name + ': ' + key + ', ' + value.value + ', ' + value.duration);
});
console.log('exercse table: ' + exerciseEntityTable.name);
_.each(exerciseEntityTable.entities, function(value, key) {
  console.log(value.name + ': ' + key + ', ' + value.value + ', ' + value.duration);
});
