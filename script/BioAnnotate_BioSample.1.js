// # of records processed: [60,151,163, 9,912,120, 45,980,399]  23m40s

import tensorflow_models_universal_sentence_encoder from '@tensorflow-models/universal-sentence-encoder';
import tf from '@tensorflow/tfjs';
import tfjs_node from '@tensorflow/tfjs-node';
import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Queue, arrayChunk, escapeCSVValue, msToMS, stringNormalize, warnInline } from '../common/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_READ_STREAM = createReadStream(join(__dirname, '../tmp/BioAnnotate_BioSample.0'));
const OUTPUT_LATLON_WRITE_STREAM = createWriteStream(join(__dirname, '../tmp/BioAnnotate_BioSample.1.latlon'));
const OUTPUT_PLACENAME_WRITE_STREAM = createWriteStream(join(__dirname, '../tmp/BioAnnotate_BioSample.1.placename'));

const BioSample_all_geo_attribute_names = Object.fromEntries(String(await readFile(join(__dirname, '../tmp/BioAnnotate_BioSample_all_geo_attribute_names')))
  .split(/\n/)
  .filter(v => !!v)
  .map(stringNormalize)
  .map(v => [v, true]));

const Classifier = async args => {
  const tmuse = await tensorflow_models_universal_sentence_encoder.load();

  args.model = await tf.loadLayersModel(args.model);

  return {
    args,
    model:args.model,
    predict:async a => await arrayChunk(a, 1024)
      .reduce((_a, _b, _c) => _a.then(async __a => {
        const predictTensor = await tmuse.embed(_b);
        const predictTensorArray = await args.model.predict(predictTensor).array();

        return __a.concat(predictTensorArray.map((v, i) => [_b[i], v]));
      }), Promise.resolve([]))
  };
};

const CACHE = { LATLON:{}, PLACENAME:{} };

const classifier = await Classifier({
  class:{ latlon:{}, missing:{}, placename:{} },
  model:'file://' + join(__dirname, 'BioSample_attribute_classifier/data/model/latlon.classifier/model.json')
});

const queue = Queue({ n:1024, onFlush:async q => {
  const predict = Object.fromEntries(await classifier.predict(Array.from(new Set(q.map(v => v[2])))));

  for(const i in q) {
    if(predict[q[i][2]][0] > 0.6) {
      ++n[1];

      CACHE.LATLON[q[i][2]] = true;
      OUTPUT_LATLON_WRITE_STREAM.write([q[i][0], q[i][1], q[i][3]].map(escapeCSVValue).join(',') + '\n');
    } else if(predict[q[i][2]][2] > 0.6) {
      ++n[2];

      CACHE.PLACENAME[q[i][2]] = true;
      OUTPUT_PLACENAME_WRITE_STREAM.write([q[i][0], q[i][1], q[i][3]].map(escapeCSVValue).join(',') + '\n');
    }
  }
} });

const ms = Date.now();
const n = [0, 0, 0];

OUTPUT_LATLON_WRITE_STREAM.write(['biosample', 'attribute_name', 'latlon?'].map(escapeCSVValue).join(',') + '\n');
OUTPUT_PLACENAME_WRITE_STREAM.write(['biosample', 'attribute_name', 'placename?'].map(escapeCSVValue).join(',') + '\n');

try {
  for await (const record of INPUT_READ_STREAM.pipe(parse({ columns:true }))) {
    ++n[0];

    const attributeValueNormalized = stringNormalize(record.attribute_value);

    if(attributeValueNormalized.replace(/[^0-9]/g, '').length/attributeValueNormalized.length > 0.4)
      CACHE.LATLON[attributeValueNormalized] = true;

    if(CACHE.LATLON[attributeValueNormalized]) {
      ++n[1];

      OUTPUT_LATLON_WRITE_STREAM.write([record.biosample, record.attribute_name, record.attribute_value].map(escapeCSVValue).join(',') + '\n');
    } else if(CACHE.PLACENAME[attributeValueNormalized]) {
      ++n[2];

      OUTPUT_PLACENAME_WRITE_STREAM.write([record.biosample, record.attribute_name, record.attribute_value].map(escapeCSVValue).join(',') + '\n');
    } else
      await queue.push(record.biosample, record.attribute_name, attributeValueNormalized, record.attribute_value);

    if(!(n[0]%1024))
      warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms));
  }
} catch(e) {
  console.error(e);

  process.exit(1);
}

await queue.flush();

warnInline('# of records processed: [' + n[0].toLocaleString() + ', ' + n[1].toLocaleString() + ', ' + n[2].toLocaleString() + '] ' + msToMS(Date.now()-ms) + '\n');
