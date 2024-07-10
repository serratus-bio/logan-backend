// July 3, 2024
// # of records processed: [72,095,996, 0, 0]  3m41s

import { parse } from 'csv-parse';
import { createReadStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { msToMS, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/biosample_geographical_location.attribute_name_attribute_value.csv'));

try {
  let OUTPUT = undefined;

  const ms = Date.now();
  const n = [0, 0, 0];

  for await (const record of INPUT_READ_STREAM.pipe(parse({ columns:true }))) {
    ++n[0];

    if(!OUTPUT)
      OUTPUT = {};

    if(!OUTPUT[record.attribute_value])
      OUTPUT[record.attribute_value] = 0;

    ++OUTPUT[record.attribute_value];

    if(!(n[0]%1024))
      warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }

  warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');

  for(const a of Object.entries(OUTPUT)
    .filter(v => v[1] > 1)
    .sort((a, b) => b[1]-a[1]).map(v => v.reverse())
    )
    console.log(a[0].toLocaleString().padStart(16, ' ') + '  ' + a[1]);
} catch(e) {
  console.error(e);

  process.exit(1);
}
