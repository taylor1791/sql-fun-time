#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var https = require('https');
var minimist = require('minimist');

var Sqlite = require('better-sqlite3');

var DIR_PATH = 'sql';
var DB_PATH = process.env.CHINOOK_DB || 'chinook.sqlite';
var CHINOOK_SRC = process.env.CHINOOK_SRC || 'https://raw.githubusercontent.com/lerocha/chinook-database/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite';

function main(argv) {
  var args = minimist(argv);

  startUpCheck(args, function(err, mode, params) {
    if (err) die(err);

    var database = new Sqlite(DB_PATH, {fileMustExist: true});
    if (mode.watchMode) {
      watch(database, params);
    } else {
      run(database, args._[0], params);
    }
  });
}

function watch(database, params) {
  fs.watch(DIR_PATH, {recursive: true}, function(eventType, fileName) {
    var sqlPath = path.join(DIR_PATH, fileName);
    run(database, sqlPath, params);
  });
}

function run(database, file, params) {
  fs.readFile(file, 'utf8', function(error, data) {
    if(error) die(error);

    var query = data
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/ $/, '');
    var statement = database.prepare(query);
    var result = statement.returnsData ?
      statement.all(params) : statement.run(params);

    console.log(JSON.stringify(result, null, 2));
  });
}

function startUpCheck(args, cb) {
  var watchMode = args.watch || args.w;
  var scriptMode = args._.length > 0;
  var iNeedHelp = args.help || args.h
  var mode = {watchMode: watchMode, scriptMode: scriptMode};

  if (iNeedHelp || !watchMode && !scriptMode) {
    die([
      '',
      '  USAGE: script [scriptName] <opts>',
      '  ',
      '    Options:',
      '      --watch        X',
      '      --params       X',
      '',
      '    Examples:',
      '      script sql/select1.sql',
      '      script sql/select_param.sql --params \'["Hello World"]\'',
      '      script --watch',
      '      script --watch --params \'[1]\''
    ]);
  }

  var params = [];
  if (args.params) {
    try {
      params = JSON.parse(args.params);
    } catch(e) {
      die([
        'Failed to parse params as valid JSON',
        e
      ]);
    }
  }


  if(!fs.existsSync(DB_PATH)) {
    console.info('Downloading the chinook sample database...');

    downloadDb(function(err) {
      if (err) {
        die([
          'There was a problem downloading the sample database. Details:',
          err,
        ]);
      }

      cb(null, mode, params);
    });
  } else {
    cb(null, mode, params);
  }
}

function downloadDb(cb) {
  https.get(CHINOOK_SRC, function(response) {
    let error;
    if (response.statusCode !== 200) {
      response.resume();
      return cb(new Error('Request Failed. Status Code: ' + response.statusCode))
    }

    var file = fs.createWriteStream(DB_PATH);
    response.pipe(file);

    var data = [];
    response.on('data', function(chunk) {
      data.push(chunk);
    });

    response.on('end', () => {
      var fileData = Buffer.concat(data);
      fs.writeFileSync(DB_PATH, fileData);
      cb();
    });
  }).on('error', cb);
}

function die(err) {
  if(!Array.isArray(err)) {
    err = [err];
  }

  err.map(function(line) {
    console.error(line);
  });

  process.exit(1);
}

main(process.argv.slice(2));
