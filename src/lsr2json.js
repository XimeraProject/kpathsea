#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import Kpathsea from './index.js';

async function* makeTextFileLineIterator(filename) {
  let chunk = fs.readFileSync(filename, 'utf8');
  
  const re = /\n|\r|\r\n/gm;
  let startIndex = 0;
  let result;
  
  for (;;) {
    if (chunk.length == 0)
      break;
    
    let result = re.exec(chunk);
    if (!result) {
      let remainder = chunk.substr(startIndex);
      chunk = remainder;
      startIndex = re.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, result.index);
    startIndex = re.lastIndex;
  }
  
  if (startIndex < chunk.length) {
    // last line didn't end in a newline char
    yield chunk.substr(startIndex);
  }
}

async function* makeFilenameIterator(filename) {
  var currentDirectory = undefined;
  let root = '';
  
  for await (let line of makeTextFileLineIterator(filename)) {
    if (line.length == 0) continue;
    
    if (line.startsWith('%')) continue;
    
    // Comments can appear in the database
    if (line.startsWith('%')) continue;

    // If a line begins with ‘/’ or ‘./’ or ‘../’ and ends with a
    // colon, it’s the name of a directory. (‘../’ lines aren’t
    // useful, however, and should not be generated.)
    if ((line.startsWith('/') || line.startsWith('.')) && line.endsWith(':')) {
      currentDirectory = line.slice(0,-1); // remove trailing colon
    } else {
      // All other lines define entries in the most recently seen
      // directory. /’s in such lines will produce possibly-strange
      // results.
      yield path.join(currentDirectory,line);
    }
  }

  return;
}

async function populateDatabase(database, filename) {
  for await (let filename of makeFilenameIterator(filename)) {
    database.add( filename );
  }

  return;
}

(async function main() {
  console.log('lsr2json: convert a ls-R database to a .json file');

  // confusingly the first argument is the node interpreter itself!
  if (process.argv.length != 4) {
    console.log("\nExpected two arguments: lsr2json ls-R output.json");
    return;
  }
  
  let inputFilename = process.argv[2];
  let outputFilename = process.argv[3];

  console.log(`Reading from ${inputFilename}...`);
  let database = new Kpathsea();
  await populateDatabase(database, inputFilename);
  console.log(`Writing to ${outputFilename}...`);  
  fs.writeFileSync(outputFilename, database.toJSON());
  console.log("Done!");

  return;
})();


/*
async function populateDatabase(root) {
  let list = [];
  
  for await (let filename of makeFilenameIterator(root)) {
    // In Kpathsea version 6.3.0 (released with TeX Live 2018), a new
    // fallback search was implemented on Unix-like systems, including
    // Macs: for each path element in turn, if no match is found by
    // the normal search, and the path element allows for checking the
    // filesystem, a second check is made for a case-insensitive
    // match.
    let f = path.basename(filename).toLowerCase();
    list.push( { basename: f, filename: filename } );
  }

  let db = await openDatabase();
  let tx = db.transaction('filenames', 'readwrite');

  for( let obj of list ) {
    tx.store.add(obj);
  }
  
  await tx.done;
}
*/

