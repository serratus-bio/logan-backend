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

    if(!OUTPUT[record.attribute_name])
      OUTPUT[record.attribute_name] = {};

    if(!OUTPUT[record.attribute_name][record.attribute_value])
      OUTPUT[record.attribute_name][record.attribute_value] = 0;

    ++OUTPUT[record.attribute_name][record.attribute_value];

    // if(n[0] > 1024*1024)
    //   break;

    if(!(n[0]%1024))
      warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }

  warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');

  OUTPUT = Object.fromEntries(Object.entries(OUTPUT).map(([k, v]) => {
    const m = Object.keys(OUTPUT[k]).length;
    const n = Object.values(OUTPUT[k]).reduce((a, b) => a+b, 0);
    const shannon = -1*Object.values(OUTPUT[k]).map(v => (v/n)*Math.log2(v/n))
      .reduce((a, b) => a+b, 0);
    const top_8 = Object.keys(OUTPUT[k]).sort((a, b) => OUTPUT[k][b]-OUTPUT[k][a]).map(_k => [_k, OUTPUT[k][_k], OUTPUT[k][_k]/n]).slice(0, 8);

    return [k, {
      m,
      n,
      shannon,
      top_8
    }];
  }));

  for(const [k, v] of Object.entries(OUTPUT).sort((a, b) => a[1].shannon-b[1].shannon)) {
    console.log('attribute_name', k);
    console.log('  n: ' + v.n.toLocaleString() + '  shannon: ' + v.shannon);
    console.log(v.top_8.map(_v => '    ' + _v[0] + '  ' + _v[1].toLocaleString() + '  ' + (_v[2]*100).toFixed(2) + '%').join('\n'));
    console.log();
  }
} catch(e) {
  console.error(e);

  process.exit(1);
}
