# common

## Classes

### Counter

Memory efficient data stucture meant to keep track of how many times it sees
each symbol *push*(ed) to it.

Internally, it keeps,
 * an array with all the symbols it holds in the order they've
   been push(ed) to the data structure.
 * an associative array with the number of times each of these symbols appeared



Usage:

```javascript
const counter = Counter({
  n:1024*1024 // max. number of symbols to keep in memory
});

counter.push(<SYMBOL>);

counter.a // ...

counter.o // ...
```


### Queue

...

### XMLParser

...

## Functions

See code.
