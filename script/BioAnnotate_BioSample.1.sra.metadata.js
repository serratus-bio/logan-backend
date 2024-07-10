// # of records processed: [19,772,275, 0]  16m03s

import { BigQuery } from '@google-cloud/bigquery';
import { createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { escapeCSVValue, msToMS, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

if(!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set');

  process.exit(1);
}

const OUTPUT_WRITE_STREAM = createWriteStream(join(__dirname, '../tmp/BioAnnotate_BioSample.1.sra.metadata'));

const ms = Date.now();
const n = [0, 0];

OUTPUT_WRITE_STREAM.write(['biosample', 'attribute_name', 'attribute_value'].map(escapeCSVValue).join(',') + '\n');

try {
  // THERE'S A BUG(?) HERE, THIS QUERY WILL SEND BACK ONE ENTRY PER SRA LIBRARY SO DATA IS SUBSTANTIALLY DUPLICATED
  await new Promise((resolve, reject) => new BigQuery().createQueryStream('SELECT biosample, geo_loc_name_country_calc, geo_loc_name_sam FROM `nih-sra-datastore.sra.metadata` WHERE geo_loc_name_country_calc IS NOT NULL;')
    .on('data', async row => {
      ++n[0];

      if(row.geo_loc_name_country_calc)
        OUTPUT_WRITE_STREAM.write([row.biosample, 'geo_loc_name_country_calc', row.geo_loc_name_country_calc].map(escapeCSVValue).join(',') + '\n');

      if(row.geo_loc_name_sam)
        row.geo_loc_name_sam.forEach(v => OUTPUT_WRITE_STREAM.write([row.biosample, 'geo_loc_name_sam', v].map(escapeCSVValue).join(',') + '\n'));

      if(!(n[0]%1024))
        warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + '] ' + msToMS(Date.now()-ms));
    })
    .on('end', resolve)
    .on('error', reject));
} catch(e) {
  console.error(e);

  process.exit(1);
}

warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
