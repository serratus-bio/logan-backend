// node script/NCBI_taxdump_upload_to_POSTGRES.js
// taxonomy_names
// # of records processed: [taxonomy_names:4,080,968]  2m28s
// taxonomy_nodes
// # of records processed: [taxonomy_names:4,080,968, taxonomy_nodes:2,597,905]  4m06s
// taxonomy_lineage
// # of records processed: [taxonomy_names:4,080,968, taxonomy_nodes:2,597,905, taxonomy_lineage:2,597,905]  5m54s

import { Console } from 'node:console';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { Queue, emptyStringToUndefined, insertQuery, msToMS, prompt, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const console = new Console(process.stderr);

const NCBI_TAXDUMP_PATH = join(__dirname, '../data/taxdump');

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

try {
  const pool = new pg.Pool({
    database:process.env.PGDATABASE,
    host:process.env.PGHOST,
    password:process.env.PGPASSWORD,
    port:process.env.PGPORT,
    user:process.env.PGUSER
  });

  const ms = Date.now();
  const n = {};
  
  // taxonomy_names
  // taxonomy_nodes
  for(const table of [
    { columns:['tax_id', 'name_txt', 'unique_name', 'name_class'], filename:'names.dmp', name:'taxonomy_names' },
    { columns:['tax_id', 'parent_tax_id', 'rank', 'embl_code', 'division_id', 'inherited_div_flag', 'genetic_code_id', 'inherited_gc_flag', 'mitochondrial_genetic_code_id', 'inherited_mgc_flag', 'genbank_hidden_flag', 'hidden_subtree_root_flag', 'comments'], filename:'nodes.dmp', name:'taxonomy_nodes' }
  ]) {
    console.debug();
    console.debug(table.name);

    const client = await pool.connect();

    const queue = Queue({ n:2048, onFlush:async q => {
      await client.query('BEGIN');

      const text = insertQuery({
        columns:table.columns,
        rows:q.length,
        table:table.name
      });

      await client.query({
        name:createHash('md5').update(text).digest('hex'),
        text,
        values:q.flat()
      });

      await client.query('COMMIT');

      if(!n[table.name])
        n[table.name] = 0;

      n[table.name] += q.length;

      warnInline('# of records processed: [' + Object.entries(n).map(([k, v]) => k + ':' + v.toLocaleString()).join(', ') + '] ' + msToMS(Date.now()-ms));
    } });

    for await(let line of createInterface({ crlfDelay:Infinity, input:createReadStream(join(NCBI_TAXDUMP_PATH, table.filename)) })) {
      line = line
        .split(/\|/)
        .map(v => v.trim());

      await queue.push(...line.slice(0, table.columns.length).map(emptyStringToUndefined));
    }

    await queue.flush();

    await client.release();
  }

  // taxonomy_lineage
  let NAMES = undefined;
  for await(let line of createInterface({ crlfDelay:Infinity, input:createReadStream(join(NCBI_TAXDUMP_PATH, 'names.dmp')) })) {
    line = line
      .split(/\|/)
      .map(v => v.trim());

    if(line[3] === 'scientific name') {
      if(!NAMES)
        NAMES = [];

      NAMES[parseInt(line[0])] = line[1];
    }
  }
  
  let NODES = undefined;
  for await(let line of createInterface({ crlfDelay:Infinity, input:createReadStream(join(NCBI_TAXDUMP_PATH, 'nodes.dmp')) })) {
    line = line
      .split(/\|/)
      .map(v => v.trim());
    
    if(!NODES)
      NODES = [];

    NODES[parseInt(line[0])] = [parseInt(line[1]), line[2]];
  }

  console.debug();
  console.debug('taxonomy_lineage');

  await (async () => {
    const client = await pool.connect();

    const queue = Queue({ n:2048, onFlush:async q => {
      await client.query('BEGIN');

      const text = insertQuery({
        columns:['tax_id', 'superkingdom', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'],
        rows:q.length,
        table:'taxonomy_lineage'
      });

      await client.query({
        name:createHash('md5').update(text).digest('hex'),
        text,
        values:q.flat()
      });

      await client.query('COMMIT');

      if(!n['taxonomy_lineage'])
        n['taxonomy_lineage'] = 0;

      n['taxonomy_lineage'] += q.length;

      warnInline('# of records processed: [' + Object.entries(n).map(([k, v]) => k + ':' + v.toLocaleString()).join(', ') + '] ' + msToMS(Date.now()-ms));
    } });

    for(let tax_id in NODES) {
      const nodeLineage = [];

      while(tax_id !== NODES[tax_id][0]) {
        nodeLineage.push([tax_id, NODES[tax_id][1]]);

        tax_id = NODES[tax_id][0];
      }

      const lineageForRank = s =>
        emptyStringToUndefined(NAMES[nodeLineage.filter(v => v[1] === s)[0]?.[0]]);

      await queue.push(
        nodeLineage[0][0],
        lineageForRank('superkingdom'),
        lineageForRank('kingdom'),
        lineageForRank('phylum'),
        lineageForRank('class'),
        lineageForRank('order'),
        lineageForRank('family'),
        lineageForRank('genus'),
        lineageForRank('species')
      );
    }

    await queue.flush();

    await client.release();
  })();

  await pool.end();

  console.debug();
} catch(e) {
  console.error(e);

  process.exit(1);
}
