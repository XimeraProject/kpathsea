# "kpathsea" for the web

This isn't realy kpathsea, but rather just barely enough to support
the Ximera cloud.  It would be nice to implement more of kpathsea.

The included tool `lsr2json` will convert the `ls-R` into a `.json`
file that can later be loaded as follows:
```
import Kpathsea from 'kpathsea'
const kpathsea = new Kpathsea({ db: theOutputFromLsr2json } );
```
Then it is possible to search for files by name with
```
kpathsea.findMatch( theBasename );
```
