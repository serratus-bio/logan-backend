// time node script/palmdb/extendPalmDBsOTUNicknameList.js > data/palmdb/palmdb4.sotu.nickname.list
// Array.from(generateAdjectiveNoun): 5.883s
// 17,290,392
// Array.from(new Set): 13.877s
// 16,193,971
// process.stdout.write: 1:22.615 (m:ss.mmm)

// real	1m45.324s
// user	1m10.438s
// sys	0m38.435s

import { parse } from 'csv-parse';
import { Console } from 'node:console';
import { createReadStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import { escapeCSVValue } from '../../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const console = new Console(process.stderr);

const ADJECTIVE_READ_STREAM = createReadStream(join(__dirname, '../../data/WordNet/adjective'));
const N = 1024*1024*16;
const NOUN_READ_STREAM = createReadStream(join(__dirname, '../../data/WordNet/noun'));
const PALMDB_SOTU_NICNKNAME_LIST = createReadStream(join(__dirname, '../../data/palmdb/palmdb2.sotu.nickname.list.20240715'));

let ADJECTIVE = undefined;
for await(const line of createInterface({
  crlfDelay:Infinity,
  input:ADJECTIVE_READ_STREAM
})) {
  if(!ADJECTIVE)
    ADJECTIVE = [];

  ADJECTIVE.push(line);
}

let NOUN = undefined;
for await(const line of createInterface({
  crlfDelay:Infinity,
  input:NOUN_READ_STREAM
})) {
  if(!NOUN)
    NOUN = [];

  NOUN.push(line);
}

const generateAdjectiveNoun = () =>
    ADJECTIVE[Math.floor(Math.random()*ADJECTIVE.length)]
  + NOUN[Math.floor(Math.random()*NOUN.length)];

let SOTU = undefined;
let NICKNAME = undefined;

for await(const record of PALMDB_SOTU_NICNKNAME_LIST.pipe(parse({ columns:true }))) {
  if(!SOTU)
    SOTU = [];

  SOTU.push(record.sotu);

  if(!NICKNAME)
    NICKNAME = [];

  if(!NICKNAME.o)
    NICKNAME.o = {};

  // palmdb2 had duplicate nicknames, this ensures those get re-assigned
  while(NICKNAME.o[record.nickname])
    record.nickname = generateAdjectiveNoun();

  NICKNAME.o[record.nickname] = true;

  NICKNAME.push(record.nickname);
}

console.time('Array.from(generateAdjectiveNoun)');
NICKNAME = NICKNAME.concat(Array.from({ length:N }, generateAdjectiveNoun));
console.timeEnd('Array.from(generateAdjectiveNoun)');

console.debug(NICKNAME.length.toLocaleString());

// warning: if Set is not stable, gg
console.time('Array.from(new Set)');
NICKNAME = Array.from(new Set(NICKNAME));
console.timeEnd('Array.from(new Set)');

console.debug(NICKNAME.length.toLocaleString());

console.time('process.stdout.write');
process.stdout.write(['id', 'sotu', 'nickname'].map(escapeCSVValue).join(',') + '\n');

for(let i=0;i<NICKNAME.length;++i)
  process.stdout.write([i+1, SOTU[i]||'NA', NICKNAME[i]].map(escapeCSVValue).join(',') + '\n');
console.timeEnd('process.stdout.write');
