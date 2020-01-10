import { version } from '../package.json';
import * as path from 'path';
import * as semver from 'semver';

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
  if (key.length == 0) {
    return tree[''];
  } else {
    if (!(key[0] in tree)) {
      return undefined;
    }
    
    return getTree( tree[key[0]], key.slice(1) );
  }
}

export default class Kpathsea {
  constructor( options = {} ) {
    this.db = options.db || { version: version, trie: {}, pathlist: [] };

    if ('root' in options) 
      this.root = options.root;
    else
      this.root = '/texmf';

    if (this.db.version) {
      if ( ! semver.satisfies( version, '~' + this.db.version ) )
        throw new Error('incompatible database version');
    } else {
      throw new Error('missing version number in database');
    }
  }

  toJSON() {
    return JSON.stringify( this.db );
  }

  add( filename ) {
    // In Kpathsea version 6.3.0 (released with TeX Live 2018), a new
    // fallback search was implemented on Unix-like systems, including
    // Macs: for each path element in turn, if no match is found by
    // the normal search, and the path element allows for checking the
    // filesystem, a second check is made for a case-insensitive
    // match.
    let f = path.basename(filename).toLowerCase();
    let dirname = path.dirname(filename);

    let pathcode = this.db.pathlist.indexOf(dirname);
    if (pathcode < 0) {
      this.db.pathlist.push( dirname );
      pathcode = this.db.pathlist.indexOf(dirname);
    }   

    if (f != path.basename(filename))
      pathcode = [pathcode, path.basename(filename)];

    insertTree( this.db.trie, f, pathcode );
  }
  
  async findMatches( partialPath ) {
    let key = path.basename(partialPath).toLowerCase();
    let matches = getTree( this.db.trie, key );
    
    if (matches === undefined)
      return [];
   
    const root = this.root;
    const pathlist = this.db.pathlist;

    matches = matches.map( function(m) {
      if (typeof m === 'number') {
        return path.join( pathlist[m], key );
      } else {
        return path.join( pathlist[m[0]], m[1] );
      }
    });

    return matches
      .filter( fullPath => fullPath.toLowerCase().endsWith( partialPath.toLowerCase() ) )
      .map( fullPath => path.join(root,fullPath) )
      .sort(function(a, b){
        return a.length - b.length;
      });
  }

  async findMatch( partialPath ) {
    let matches = await this.findMatches( partialPath );

    if (matches.length > 0)
      return matches[0];
    else
      return undefined;
  }
}
