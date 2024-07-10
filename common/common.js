import { Parser } from 'node-expat';
import { clearLine, cursorTo } from 'node:readline';
import { createInterface } from 'node:readline/promises';

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
 * Splits an array into chunks of n size
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
 * Returns an array's elements in a random order.
 * Biased, but good enough.
 * 
 * @param {*} a array
 * @returns array
 */
export const arrayShuffle = a => a.sort(() => Math.random()-0.5);

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
