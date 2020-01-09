import * as path from 'path';
import * as fs from 'fs';

async function* makeTextFileLineIterator(fileURL) {
  let chunk = fs.readFileSync("./ls-R", 'utf8');
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

async function* makeFilenameIterator() {
  var currentDirectory = undefined;
  let root = '';
  
  for await (let line of makeTextFileLineIterator(path.join(root,'ls-R'))) {
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

/*
async function openDatabase() {
  let shouldPopulate = false;
  
  let db = await idb.openDB('kpathsea', 13, { async upgrade(db, oldVersion, newVersion, tx) {
    console.log("Upgrading");
    shouldPopulate = true;
    
    if (!db.objectStoreNames.contains('filenames')) {
      let store = db.createObjectStore('filenames', {keyPath: 'filename'});
      store.createIndex('basename', 'basename', {unique: false});
      store.createIndex('filename', 'filename', {unique: true});
    }
  }});

  if (shouldPopulate) {
    console.log("Popualting...");
    await populateDatabase('/texmf/');
  }

  return db;
}
*/

function insertTree( tree, key, value ) {
  if (key.length == 0) {
    if (tree[''] === undefined)
      tree[''] = [];
    
    tree[''].push(value);
  } else {
    if (!(key[0] in tree)) {
      tree[key[0]] = {};
    }
    
    insertTree( tree[key[0]], key.slice(1), value );
  }
}

function getTree( tree, key ) {
  if (!(key[0] in tree)) {
    return undefined;
  }

  if (key.length == 0) {
    return tree[''];
  } else
    return getTree( tree[key[0]], key.slice(1), value );
}

async function populateDatabase() {
  let list = [];
  let result = {};
  let pathlist = [];
  
  for await (let filename of makeFilenameIterator()) {
    // In Kpathsea version 6.3.0 (released with TeX Live 2018), a new
    // fallback search was implemented on Unix-like systems, including
    // Macs: for each path element in turn, if no match is found by
    // the normal search, and the path element allows for checking the
    // filesystem, a second check is made for a case-insensitive
    // match.
    let f = path.basename(filename).toLowerCase();

    let dirname = path.dirname(filename);
    
    //list.push( { basename: f, filename: filename } );

    let pathcode = pathlist.indexOf(dirname);
    if (pathcode < 0) {
      pathlist.push( dirname );
      pathcode = pathlist.indexOf(dirname);
    }   

    if (f != path.basename(filename))
      pathcode = [pathcode, path.basename(filename)];

    insertTree( result, f, pathcode );
    /*
    if (f in result)  {
      if (typeof result[f] == 'Array')
        result[f].push( pathcode );
      else
        result[f] = [result[f], pathcode];
    } else
      result[f] = pathcode;
    */
  }

  return { database: result, pathlist: pathlist };
}

(async function() {
  //await populateDatabase('');
  console.log(JSON.stringify(await populateDatabase('')));
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

/*
export async function findMatches( partialPath ) {
  let db = await openDatabase();

  let tx = db.transaction('filenames', 'readonly');

  let matches = await tx.store.index('basename').getAllKeys(path.basename(partialPath).toLowerCase());

  db.close();
  
  const root = '/texmf';
  
  return matches
    .filter( fullPath => fullPath.toLowerCase().endsWith( partialPath.toLowerCase() ) )
    .map( fullPath => path.join(root,fullPath) )
    .sort(function(a, b){
      return a.length - b.length;
    });
}

export async function findMatch( partialPath ) {
  let matches = await findMatches( partialPath );

  if (matches.length > 0)
    return matches[0];
  else
    return undefined;
}
*/
