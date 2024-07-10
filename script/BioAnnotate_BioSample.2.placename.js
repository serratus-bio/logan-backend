// # of records processed: [45,980,399, 40,834,264, 314,874]  63m48s

import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { escapeCSVValue, msToMS, stringNormalize, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.1.placename'));
const OUTPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename.Amazon.Location'));
const OUTPUT_WRITE_STREAM = createWriteStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename'));

const CACHE = {};

for await (const record of OUTPUT_READ_STREAM.pipe(parse({ columns:true })))
  CACHE[record.placenameNormalized] = record.latlon;

process.stderr.write('[CACHE]\n');

const ms = Date.now();
const n = [0, 0];

OUTPUT_WRITE_STREAM.write(['biosample', 'attribute_name', 'attribute_value', 'latlon'].map(escapeCSVValue).join(',') + '\n');

try {
  for await (const record of INPUT_READ_STREAM.pipe(parse({ columns:true }))) {
    ++n[0];

    const placenameNormalized = stringNormalize(record['placename?']);
    
    if(placenameNormalized.includes('missing'))
      continue;

    if(CACHE[placenameNormalized]) {
      ++n[1];

      OUTPUT_WRITE_STREAM.write([record.biosample, record.attribute_name, record['placename?'], CACHE[placenameNormalized]].map(escapeCSVValue).join(',') + '\n');
    }

    if(!(n[0]%1024))
      warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + Object.keys(CACHE).length.toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }
} catch(e) {
  console.error(e);

  process.exit(1);
}

warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + Object.keys(CACHE).length.toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
