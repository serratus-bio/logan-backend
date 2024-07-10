import { Parser } from 'node-expat';
import { clearLine, cursorTo } from 'node:readline';
import { createInterface } from 'node:readline/promises';

export const Aggregator = args => ({
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

export const arrayChunk = (a, n) => Array.from({ length:Math.ceil(a.length/n) }, (e, i) => a.slice(i*n, i*n+n));
export const arrayShuffle = a => a.sort(() => Math.random()-0.5);

export const escapeCSVValue = s => /[\n",]/.test(s)
  ? '"' + s.replace(/"/g, '""') + '"'
  : s;

export const msToMS = ms => ' ' + (ms/1000/60|0).toLocaleString() + 'm' + String(((ms/1000)|0)%60).padStart(2, '0') + 's';

export const prompt = async question => {
  const rl = createInterface({ input:process.stdin, output:process.stderr });

  try {
    const answer = await rl.question(question);
    
    return answer.trim();
  }
  catch (error) { throw error; }
  finally { rl.close(); }
};

export const promptYN = async question => {
  const v = await prompt(question + ' (y/n)? ');

  return v.trim().toLowerCase() === 'true'
    || v.trim().toLowerCase() === 'y'
    || v.trim().toLowerCase() === 'yes';
};

export const stringNormalize = s => s
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .toLowerCase()
  .trim();

export const warnInline = s => {
  clearLine(process.stderr);
  cursorTo(process.stderr, 0);
  process.stderr.write(s);
};
