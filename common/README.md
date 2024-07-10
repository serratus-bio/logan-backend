# common

## Classes

### Counter

Memory efficient data stucture meant to keep track of how many times it sees
each symbol **push**ed to it.

Internally, it keeps,
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

...

### XMLParser

...

## Functions

See code.
