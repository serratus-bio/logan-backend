// # of records processed: [45,980,399, 314,874]  195m57s

import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';
import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Queue, arrayChunk, escapeCSVValue, msToMS, stringNormalize, warnInline } from '../common/common.js';
import { access, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.1.placename'));
try {
  await access(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename.Amazon.Location'));
} catch {
  await writeFile(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename.Amazon.Location'), ['placenameNormalized', 'latlon'].map(escapeCSVValue).join(',') + '\n');
  
}
const OUTPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename.Amazon.Location'));
const OUTPUT_WRITE_STREAM = createWriteStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename.Amazon.Location'), { flags:'a' });

const CACHE = {};

for await (const record of OUTPUT_READ_STREAM.pipe(parse({ columns:true })))
  CACHE[record.placenameNormalized] = record.latlon;

const client = new LocationClient();

const queue = Queue({ n:1024*32, onFlush:async q => {
  for(const chunk of arrayChunk(Array.from(new Set(q.map(v => v[0]))), 8)) {
    for(const [k, v] of await Promise.all(chunk.map(async v => [
      v,
      (await client.send(new SearchPlaceIndexForTextCommand({ IndexName:'AmazonLocationPlaceIndexHERE', Text:v.substr(0, 200) })))
        .Results?.[0]?.Place?.Geometry?.Point?.reverse().join(',')
    ]))) {
      ++n[1];

      CACHE[k] = v;
      
      OUTPUT_WRITE_STREAM.write([k, CACHE[k]].map(escapeCSVValue).join(',') + '\n');
    }

    warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + Object.keys(CACHE).length.toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }
} });

const ms = Date.now();
const n = [0, 0, 0];

try {
  for await (const record of INPUT_READ_STREAM.pipe(parse({ columns:true }))) {
    ++n[0];

    const placenameNormalized = stringNormalize(record['placename?']);
    
    if(placenameNormalized.includes('missing'))
      continue;

    if(CACHE[placenameNormalized] !== undefined)
      ++n[1];
    else
      await queue.push(placenameNormalized);

    if(!(n[0]%1024))
      warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + Object.keys(CACHE).length.toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }
} catch(e) {
  console.error(e);

  process.exit(1);
}

await queue.flush();

warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + Object.keys(CACHE).length.toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
