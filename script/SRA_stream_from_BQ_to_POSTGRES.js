// node script/SRA_stream_from_BQ_to_POSTGRES.js --query 'SELECT acc FROM `nih-sra-datastore.sra.metadata`' --table sra
// May 16-17, 2024
// # of records BQ: 30,978,859 POSTGRES:  6,733,824  18m04s (all BQ records read, Queue.n=8192)
// # of records BQ: 30,978,859 POSTGRES: 30,978,859  50m08s (all done, Queue.n=8192)
// node script/SRA_stream_from_BQ_to_POSTGRES.js --query 'SELECT acc, assay_type, center_name, consent, experiment, sample_name, instrument, librarylayout, libraryselection, librarysource, platform, sample_acc, biosample, organism, sra_study, releasedate, bioproject, mbytes, avgspotlen, mbases, library_name, biosamplemodel_sam, collection_date_sam, geo_loc_name_country_calc, geo_loc_name_country_continent_calc, geo_loc_name_sam FROM `nih-sra-datastore.sra.metadata`' --table sra
// # of records BQ: 30,986,947 POSTGRES: 30,986,947  182m16s (Queue.n=1024)

import { BigQuery } from '@google-cloud/bigquery';
import minimist from 'minimist';
import { createHash } from 'node:crypto';
import pg from 'pg';

import { Queue, msToMS, prompt, warnInline } from '../common/common.js';

const ARGV = minimist(process.argv.slice(2));

for(const v of [
  'PGDATABASE',
  'PGHOST',
  'PGPASSWORD',
  'PGPORT',
  'PGUSER'
]) {
  if(!process.env[v]) {
    process.env[v] = await prompt(v + ' is not set. Enter it now or leave empty to exit: ');

    if(!process.env[v])
      process.exit(1);
  }
}

if(!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set');

  process.exit(1);
}

if(!ARGV.query) {
  console.error('--query is required');

  process.exit(1);
}

if(!ARGV.table) {
  console.error('--table is required');

  process.exit(1);
}

const bigquery = new BigQuery();

try {
  const pool = new pg.Pool({
    database:process.env.PGDATABASE,
    host:process.env.PGHOST,
    password:process.env.PGPASSWORD,
    port:process.env.PGPORT,
    user:process.env.PGUSER
  });

  const client = await pool.connect();

  const insertQuery = (t, c, n) => 'INSERT INTO ' + t + ' (' + c.join(', ') + ')\nVALUES ' + Array.from({ length:n }, (a0, b0) => '(' + Array.from({ length:c.length }, (a1, b1) => '$' + (c.length*b0+b1+1)).join(', ') + ')').join(', ') + ';';

  let ms = Date.now();
  let n = [0, 0];

  const queue = Queue({ n:1024, onFlush:async q => {
    await client.query('BEGIN');

    await client.query({
      name:createHash('md5').update('INSERT_' + ARGV.table + '_' + Object.keys(q[0][0]).join('_') + '_' + q.length).digest('hex'),
      text:insertQuery(ARGV.table, Object.keys(q[0][0]), q.length),
      values:q.map(r => Object.values(r[0]).map(v => {
        if(Array.isArray(v))
          return v[0];
        else if(v instanceof Object && v.value)
          return v.value;

        return v ?? undefined;
      })).flat()
    });

    await client.query('COMMIT');

    n[1] += q.length;

    warnInline('# of records BQ: ' + n[0].toLocaleString() + ' POSTGRES: ' + n[1].toLocaleString() + ' ' + msToMS(Date.now()-ms));
  } });

  await new Promise((resolve, reject) => bigquery.createQueryStream(ARGV.query)
    .on('data', async row => {
      ++n[0];

      if(!(n[0]%1024))
        warnInline('# of records BQ: ' + n[0].toLocaleString() + ' POSTGRES: ' + n[1].toLocaleString() + ' ' + msToMS(Date.now()-ms));

      await queue.push(row);
    })
    .on('end', resolve)
    .on('error', reject));

  await queue.flush();
  
  await client.release();

  await pool.end();

  warnInline('# of records BQ: ' + n[0].toLocaleString() + ' POSTGRES: ' + n[1].toLocaleString() + ' ' + msToMS(Date.now()-ms) + '\n');
} catch(e) {
  console.error(e);

  process.exit(1);
}
