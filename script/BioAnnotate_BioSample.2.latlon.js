// # of records processed: [9,912,120, 9,224,888]  1m11s

import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { escapeCSVValue, msToMS, stringNormalize, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.1.latlon'));
const OUTPUT_WRITE_STREAM = createWriteStream(join(__dirname, '../tmp/BioAnnotate_BioSample.2.latlon'));

const ms = Date.now();
const n = [0, 0];

OUTPUT_WRITE_STREAM.write(['biosample', 'attribute_name', 'attribute_value', 'latlon'].map(escapeCSVValue).join(',') + '\n');

const BioSampleAggregator = {
  RE:{
    ensw:/-?\d+(\.\d+)?\s*[ensw]/g,
    number:/-?\d+(\.\d+)/g
  },
  flush:function() {
    const biosample = this.queue[0][0];

    let latitude = undefined;
    let longitude = undefined;

    for(const [k, v] of this.queue.map(v => v.slice(1))) {
      let m_number = stringNormalize(v).match(this.RE.number);

      if(m_number && m_number.length === 1) {
        if(stringNormalize(k).includes('latitude'))
          latitude = [k, v, parseFloat(m_number[0])];
        else if(stringNormalize(k).includes('longitude'))
          longitude = [k, v, parseFloat(m_number[0])];
      } else {
        let m_ensw = stringNormalize(v).match(this.RE.ensw);

        if(m_ensw && m_ensw.length === 2) {
          latitude = [k, v, parseFloat(m_ensw[0]) * (m_ensw[0].substr(-2) === ' n' ? 1 : -1)];
          longitude = [k, v, parseFloat(m_ensw[1]) * (m_ensw[1].substr(-2) === ' e' ? 1 : -1)];
        }
      }
    }

    if(latitude && longitude) {
      ++n[1];

      const [k, v] = latitude[0] === longitude[0] ? [latitude[0], latitude[1]] : [[latitude[0], longitude[0]].join(','), [latitude[1], longitude[1]].join(',')];

      OUTPUT_WRITE_STREAM.write([biosample, k, v, [latitude[2], longitude[2]].join(',')].map(escapeCSVValue).join(',') + '\n');
    }

    delete this.queue;
  },
  push:function(biosample, attribute_name, latlon) {
    if(this.queue && this.queue[0][0] !== biosample)
      this.flush();

    if(!this.queue)
      this.queue = [];

    this.queue.push([biosample, attribute_name, latlon]);
  },
  queue:undefined
};

try {
  for await (const record of INPUT_READ_STREAM.pipe(parse({ columns:true }))) {
    ++n[0];

    BioSampleAggregator.push(record.biosample, record.attribute_name, record['latlon?']);

    if(!(n[0]%1024))
      warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }

  BioSampleAggregator.flush();
} catch(e) {
  console.error(e);

  process.exit(1);
}

warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
