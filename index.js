'use strict';

const fs = require('fs');
const ArgumentParser = require('argparse').ArgumentParser; 
const EntityTable = require('./lib/EntityTable');
const ActivityParser = require('./lib/ActivityParser');
const Simulation = require('./lib/Simulation');

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
// Also, the input parsers are not required to do any kind of work in the
// filesystem.
try {
  var foodEntityTable = EntityTable.FoodTable(fs.readFileSync(args.food));
  var exerciseEntityTable = EntityTable.ExerciseTable(
      fs.readFileSync(args.exercise));
  var inputArray = ActivityParser(fs.readFileSync(args.input));
} catch (err) {
  argParser.printHelp();
  throw err;
}

var simulation = Simulation(foodEntityTable, exerciseEntityTable, inputArray);
simulation.runSimulation();
