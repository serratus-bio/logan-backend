# common

## Classes

### Counter

Memory efficient data stucture meant to keep track of how many times it sees
each symbol **push**ed to it.

Internally, it keeps:
 * an array with all the symbols it holds in the order they've
   been **push**ed to the data structure.
 * an associative array with the number of times each of these symbols appeared

The structure takes an argument, **n**, with the maximum number of symbols
to keep track of. When a new symbol is **push**ed, if n is at its limit,
the structure will start removing symbols following a FIFO method and remove
them from the associative array if their cummulative count is one.

This greatly reduces the memory footprint of the data structure and allows it to
work on datasets much larger than the allowed resident set size of the program.

Usage:

```javascript
const counter = Counter({ n:1024*1024 });

counter.push("[SYMBOL]");

counter.o["[SYMBOL]"]; // number of times SYMBOL appears on the input set
```

Calculating how many symbols appear only once in the input set is possible,
even after they were deleted:

  1. Retrieve the set of symbols that were seen more than one time.
  ```javascript
  Object.entries(counter.o).filter(v => v[1] > 1);
  ```
  2. Subtract from the total number of symbols in the input set.
  3. The remainder is the symbols that appear only once.
  ```javascript
  Object.keys("[INPUT SET]").filter(k => "[NOT IN (1)]");
  ```


### Queue

A Queue is a construction that executes a given function with a an aggregated
invocation parameter list only after:

* A threshold has been exceeded (**n**)
* It is explicitly told to do so (**flush**)

This is useful in situations when, for a given set of inputs, the side effects
of calling a given function on each element are, comparatively, more expensive
than what the function is intended to do. A Queue is a primitive that allows to
carry out batch invocations of one single function.

An example could be inserting rows into a database, it is better to aggregate
a few thousand rows and write them all in a single call, than doing so for each
row since disk/network latency and other side effects consume the vast majority
of such function's execution time.

The construction takes two arguments:
 * **n**: number of items to buffer before triggering a **flush** operation
 * **onFlush**: (async) function that is called on each **flush** operation

And exposes two methods:
 * (async) **flush**:
   dispatches **f** with the current aggregated queue and clears it
 * (async) **push**:
   adds an item to the queue, calls **flush** when **n** is reached

**onFlush** callback's only argument is an array with all the elements that
have been **push**ed to the queue up to when **flush** was called. An example:

```javascript
// if your push calls look like this ...
await Queue.push(1, 2);
await Queue.push(3, 4, 5, 6);
await Queue.push(7, 8);

// ... when Queue.flush() is called ...
await Queue.flush();

// ... onFlush will be called with an array like:
// [
//   [1, 2],
//   [3, 4, 5, 6],
//   [7, 8]
// ]
```

You should always ```await``` on these methods, since once they return there is
a guarantee that the queue has been processed properly.

Usage:

```javascript
const queue = Queue({
  n:1024,
  onFlush:async q => {
    "[PROCESS q]"
  }
});

while("[CONDITION]")
  await queue.push("[ARGUMENTS]");

// always call flush() at the end
// to make sure all the elements that remain in the queue are processed
await queue.flush();
```

### XMLParser

A streaming XML parser using [libexpat](https://libexpat.github.io/) as backend.
Requires `node-expat` (`npm install node-expat`) to work.

The parser operates on node.js [Stream](https://nodejs.org/api/stream.html)s
and does not allocate memory other than a few transient objects that are needed
to populate **startElement**. This allows it to parse large XML files while
keeping an extremely low memory footprint.

The parser takes a single argument, **startElement**, which is the name of the
XML element tags in the document that will be returned to the user.

The parser inherits the EventEmitter class. Each time a **startElement** is
found, a **node** event is emitted with a single object that holds all its data
including its child nodes. The structure of this object is as follows:

 * attributes of the node are in an associative map stored under the "$" key
 * all text on this node is concatenated and stored under the "_" key
 * child nodes are stored in arrays under keys corresponding to their tag name
   multiple child nodes with the same tag name are stored in the same array
   each of this child nodes is an object that follows the same structure

Example, an XML file like:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root a="one" b="two">
  <first c="three">First</first>
  <second f="four">Second</second>
</root>
```

... would get turned into an object like:

```javascript
// root
{
  $:{
    a:'one',
    b:'two'
  },
  first:{
    $:{ c:'three' },
    _:'First'
  },
  second:{
    $:{ d:'four' },
    _:'Second'
  }
}
```

Usage:

* Instantiate the parser (```new XMLParser()```).
* Pipe data to it as you would do with any other **Stream**.


```javascript
try {
  await pipeline([
    createReadStream("[FILENAME]"),
    XMLParser({ startElement:'"[ELEMENT TAG]"' })
      .on('node', node => {
        node.$; // attributes
        node._; // text

        Object.keys(node); // child nodes
      })
  ]);
} catch(e) {
  // ...
}
```

## Functions

[See code](common.js).
