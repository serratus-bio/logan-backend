import { Parser } from 'node-expat';
import { createReadStream } from 'node:fs';
import { clearLine, cursorTo } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { PassThrough } from 'node:stream';

export const Counter = args => ({
  a:undefined,
  o:undefined,
  push:function(v) {
    if(!this.o)
      this.o = {};

    if(!this.o[v]) {
      if(!this.a)
        this.a = [];

      this.a.push(v);

      while(this.a?.length > args.n) {
        const a = this.a.shift();

        if(this.o[a] === 1)
          delete this.o[a];
      }

      this.o[v] = 0;
    }

    ++this.o[v];
  }
});

export const FASTAParser = args => {
  let FASTA = undefined;

  const FASTAParser = Object.assign(
    new PassThrough()
      .on('pipe', src => {
        createInterface({ input:src })
          .on('close', FASTAParser.flush)
          .on('line', line => {
            if(line[0] === '>') {
              FASTAParser.flush();

              FASTA = [line];
            } else if(FASTA) {
              if(!FASTA[1])
                FASTA[1] = [];

              FASTA[1].push(line);
            }
          });
        
        FASTAParser.resume();
      }),
      { flush:() => {
        if(FASTA) {
          FASTAParser.emit('FASTA', [FASTA[0]].concat(FASTA[1] ? FASTA[1].join('\n') : []));

          FASTA = undefined;
        }
      } }
    );
  
  return FASTAParser;
};

export const Queue = args => ({
  flush:async function() {
    if(!this.flush.mutex)
      this.flush.mutex = Promise.resolve();

    if(this.queue) {
      const queue = this.queue;
      delete this.queue;

      this.flush.mutex = this.flush.mutex.then(async () => args.onFlush(queue));
    }

    await this.flush.mutex;
  },
  queue:undefined,
  push:async function(..._args) {
    if(!this.queue)
      this.queue = [];

    this.queue.push(_args);

    if(this.queue.length === args.n)
      await this.flush();
  }
});

export const XMLParser = args => {
  let node = undefined;

  return new Parser('UTF-8')
    .on('endElement', function(name) {
      if(node) {
        if(!Object.values(node.at(-2))[0][Object.keys(node.at(-1))[0]])
          Object.values(node.at(-2))[0][Object.keys(node.at(-1))[0]] = [];

        Object.values(node.at(-2))[0][Object.keys(node.at(-1))[0]].push(Object.values(node.at(-1))[0]);

        node.pop();

        if(node.length === 1) {
          this.emit('node', { [Object.keys(node.at(-1)['?xml'])[0]]:Object.values(node.at(-1)['?xml'])[0][0] });

          node = undefined;
        }
      }
    })
    .on('startElement', (name, attrs) => {
      if(name === args.startElement || node) {
        if(!node)
          node = [{ '?xml':{} }];

        node.push({ [name]:{ ...attrs && { $:attrs } } });
      }
    })
    .on('text', text => {
      if(node) {
        if(!Object.values(node.at(-1))[0]._)
          Object.values(node.at(-1))[0]._ = '';

        Object.values(node.at(-1))[0]._ = Object.values(node.at(-1))[0]._ + text;
      }
    });
};

/**
 * Splits an array into chunks of n size.
 * 
 * e.g. when n === 2
 * [a, b, c, d, e] => [[a, b], [c, d], [e]]
 * 
 * @param {*} a array
 * @param {*} n chunk size
 * @returns array of arrays
 */
export const arrayChunk = (a, n) => Array.from({ length:Math.ceil(a.length/n) }, (e, i) => a.slice(i*n, i*n+n));

/**
 * Generates an array of objects from an array of arrays and a list of columns.
 * 
 * e.g.
 *   a = [[1, 2], [3, 4]]
 *   c = ['a', 'b']
 * 
 *   would return
 * 
 *   [{ a:1, b:2 }, { a:3, b:4 }]
 * 
 * @param {*} a array of arrays
 * @param {*} c column names
 * @returns array of objects
 */
export const arrayMapColumns = (a, c) => a.map(v => Object.fromEntries(c.map((_v, _i) => [_v, v[_i]])));

/**
 * Returns an array's elements in a random order.
 * Slightly biased, but still good enough for some applications.
 * 
 * @param {*} a array
 * @returns array
 */
export const arrayShuffle = a => a.sort(() => Math.random()-0.5);

/**
 * Returns a function that consumes and returns a value from an async iterable
 * object each time it is called.
 * @param {*} async iterable object
 * @returns async function
 */
export const asyncFunctionFromAsyncIterable = asyncIterable => {
  const asyncGenerator = asyncIterable();

  return async () => {
    const IteratorResult = await asyncGenerator.next();

    if(!IteratorResult.done)
      return IteratorResult.value;
  };
};

/**
 * Returns an async generator that consumes a CSV file line by line.
 * Each line is parsed and an array is returned with all the fields found in it.
 * If [args.header == true] then an object is returned instead, with key/value
 * pairs mapped according to the CSV file header.
 * @param {*} args.header
 * @param {*} args.input
 * @returns async iterable object
 */
export const asyncIterableFromCSV = async args => {
  const asyncIterator = asyncIterableFromAsyncIterator(
    createInterface({ input:createReadStream(args.input) })
  )();

  if(args.header)
    args.header = splitCSVLine((await asyncIterator.next()).value);

  return async function* () {
    for await(let v of asyncIterator) {
      v = splitCSVLine(v);

      if(args.header)
        v = Object.fromEntries(args.header.map((_v, _i) => [_v, v[_i]]));

      yield v;
    }
  };
};

/**
 * Returns an async generator function that consumes an AsyncIterator.
 * @param {*} AsyncIterator
 * @returns async iterable object
 */
export const asyncIterableFromAsyncIterator = asyncIterator => async function* () {
  for await(const v of asyncIterator)
    yield v;
};

/**
 * Returns an async generator function that binds to a specific event on a
 * ReadableStream and yields the values coming through it until it is closed.
 * @param {*} args.on
 * @param {*} args.stream
 * @returns async iterable object
 */
export const asyncIterableFromStream = args => {
  let { promise, resolve, reject } = Promise.withResolvers();

  let buffer = undefined;
  let readable = true;

  args.stream
    .on('close', () => {
      readable = false;

      resolve();
    })
    .on('end', () => {
      readable = false;

      resolve();
    })
    .on('error', () => {
      readable = false;

      resolve();
    })
    .on(args.on, value => {
      if(!buffer)
        buffer = [];

      buffer.push(value);

      resolve();
    });

  return async function* () {
    while(readable || buffer) {
      await promise;

      if(buffer) {
        while(buffer.length)
          yield buffer.shift();

        buffer = undefined;
      }

      ({ promise, resolve, reject } = Promise.withResolvers());
    }
  };
};

/**
 * Returns undefined when a string is empty, otherwise returns the string.
 * 
 * @param {*} s string
 * @returns undefined | string
 */
export const emptyStringToUndefined = s => s === '' ? undefined : s;

/**
 * Quickly computes a string that is properly escaped for an CSV file.
 * Much more efficient than loading a CSV library just for this.
 * 
 * Typically, for each row in your CSV file, you would have an array of values,
 * map them through this function and write the result of join(',')-ing them.
 * 
 * @param {*} s string
 * @returns string
 */
export const escapeCSVValue = s => /[\n",]/.test(s)
  ? '"' + s.replace(/"/g, '""') + '"'
  : s;

/**
 * Returns a string with the minutes and seconds elapsed
 * in the specified millisecond interval.
 * 
 * @param {*} ms milliseconds
 * @returns string [00m00s]
 */
export const msToMS = ms => ' ' + (ms/1000/60|0).toLocaleString() + 'm' + String(((ms/1000)|0)%60).padStart(2, '0') + 's';

/**
 * Returns a string with an INSERT prepared statement for the specified
 * table, columns and number of rows.
 * 
 * @param {*} args.columns array with column names
 * @param {*} args.table table name
 * @param {*} args.rows number of rows
 * @returns string
 */
export const insertQuery = args => 'INSERT INTO ' + args.table + ' (' + args.columns.map(v => '"' + v + '"').join(', ') + ') VALUES ' + Array.from({ length:args.rows }, (a0, b0) => '(' + Array.from({ length:args.columns.length }, (a1, b1) => '$' + (args.columns.length*b0+b1+1)) + ')').join(', ') + ';';

/**
 * Asks the user for input, returns the string that was provided.
 * Blocks.
 * 
 * @param {*} question prompt to show to the user
 * @returns string
 */
export const prompt = async question => {
  const rl = createInterface({ input:process.stdin, output:process.stderr });

  try {
    const answer = await rl.question(question);
    
    return answer.trim();
  }
  catch (error) { throw error; }
  finally { rl.close(); }
};

/**
 * Asks the user a yes/no question.
 * Returns true if the answer was positive.
 * Returns false otherwise.
 * Convenience function wrapper around prompt().
 * 
 * @param {*} question prompt to show to the user
 * @returns boolean
 */
export const promptYN = async question => {
  const v = await prompt(question + ' (y/n)? ');

  return v.trim().toLowerCase() === 'true'
    || v.trim().toLowerCase() === 'y'
    || v.trim().toLowerCase() === 'yes';
};

/**
 * Returns each field of a CSV line as an array.
 * 
 * @param {*} s string
 * @returns array of strings
 */
export const splitCSVLine = s => s.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(field => field.replace(/^"(.*)"$/, '$1'));

/**
 * Returns a normalized version of a string, applying the following operations:
 * 
 * * Removes all diacritical marks and compound characters
 * * Collapses all kinds of "space" sequences into a single regular space
 *     e.g. "a  \t  b" => "a b"
 * * Converts the string to lowercase
 * * Removes "space"s from the beginning and the end of the string
 * 
 * @param {*} s string
 * @returns string
 */
export const stringNormalize = s => s
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .toLowerCase()
  .trim();

/**
 * Writes a given string to STDERR.
 * Resets the buffer before writing, so it's useful for building progress bars,
 * updates and such things.
 * 
 * @param {*} s string
 */
export const warnInline = s => {
  clearLine(process.stderr);
  cursorTo(process.stderr, 0);
  process.stderr.write(s);
};
