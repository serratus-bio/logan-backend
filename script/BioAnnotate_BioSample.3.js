// # of records processed: [80,212,834, 80,212,834]  72m54s
// July 2, 2024
// node --max-old-space-size=8192 script/BioAnnotate_BioSample.3.js
// # of records processed: [80,212,834, 76,907,232, 76,907,232]  128m01s

import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { Queue, msToMS, warnInline } from '../common/common.js';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

for(const v of [
  'PGDATABASE',
  'PGHOST',
  'PGPASSWORD',
  'PGPORT',
  'PGUSER'
])
  if(!process.env[v]) {
    console.error(v + ' is not set.');

    process.exit(1);
  }

const INPUT_LATLON_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.latlon'));
const INPUT_PLACENAME_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.placename'));
const INPUT_SRA_METADATA_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.sra.metadata'));

try {
  const pool = new pg.Pool({
    database:process.env.PGDATABASE,
    host:process.env.PGHOST,
    password:process.env.PGPASSWORD,
    port:process.env.PGPORT,
    user:process.env.PGUSER
  });
  
  const client = await pool.connect();
  
  const insertQuery = (c, n) => 'INSERT INTO biosample_geographical_location (' + c.join(', ') + ')\nVALUES ' + Array.from({ length:n }, (a0, b0) => '(' + Array.from({ length:c.length }, (a1, b1) => c[b1] === 'lat_lon' ? 'ST_SetSRID(ST_MakePoint($' + ((c.length+c.filter(v => v === 'lat_lon').length)*b0+b1+1) + ', $' + ((c.length+c.filter(v => v === 'lat_lon').length)*b0+b1+2) + '), 4326)' : '$' + ((c.length+c.filter(v => v === 'lat_lon').length)*b0+b1+1)).join(', ') + ')').join(', ') + ';';
  
  const queue = Queue({ n:1024*8, onFlush:async q => {
    await client.query('BEGIN');

    await client.query({
      name:'INSERT_biosample_geographical_location_' + q.length,
      text:insertQuery(Object.keys(q[0][0]), q.length),
      values:q.map(v => Object.entries(v[0]).filter(([k, v]) => k !== 'lat_lon').map(v => v[1]).concat(v[0].lat_lon.split(/\,/).reverse().map(parseFloat))).flat()
    });
  
    await client.query('COMMIT');

    n[2] += q.length;
  } });

  let MD5 = Object.assign({}, {
    contains:k => MD5[k.substring(0, 2)]?.[k.substring(2)],
    push:k => {
      if(!MD5[k.substring(0, 2)])
        MD5[k.substring(0, 2)] = {};

      MD5[k.substring(0, 2)][k.substring(2)] = true;
    }
  });

  const ms = Date.now();
  const n = [0, 0, 0];

  for(const stream of [
    INPUT_LATLON_READ_STREAM,
    INPUT_PLACENAME_READ_STREAM,
    INPUT_SRA_METADATA_READ_STREAM
  ]) {
    for await (const record of stream.pipe(parse({ columns:true }))) {
      ++n[0];

      const md5 = createHash('md5').update(JSON.stringify(record)).digest('hex');

      if(!MD5.contains(md5)) {
        MD5.push(md5);

        ++n[1];

        await queue.push(record);
      }

      if(!(n[0]%1024))
        warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms));
    }
  }

  await queue.flush();
  
  await client.release();

  await pool.end();

  warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
} catch(e) {
  console.error(e);

  process.exit(1);
}
