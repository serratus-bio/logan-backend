import Jimp from 'jimp';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { arrayChunk } from '../common/common.js';

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

const COLOR = [
  '#EFA1FF',
  '#0275DC',
  '#993E01',
  '#4C005B',
  '#191919',
  '#015C31',
  '#2CCE48',
  '#FFCC99',
  '#808080',
  '#95FFB5',
  '#8F7C00',
  '#9DCC00',
  '#C20088',
  '#013380',
  '#FFA405',
  '#FFA8BB'
];
const TILE_HEIGHT = 256;
const TILE_WIDTH = 256;
const TILE_QUERY_HEIGHT_N = 64;
const TILE_QUERY_WIDTH_N = 64;
const ZOOM = 4;

const COLOR_NUMBER = COLOR.map(v => parseInt('FF' + v.substring(1).split(/(.{2})/).filter(_v => !!_v).reverse().join('').toLowerCase(), 16));
const TILE_N = Math.pow(2, ZOOM);

const MultiPolygon = [];

const BUFFER = async args => {
  const BUFFER = new Uint8Array(4*args.width*args.height);

  for(let y=0;y<args.height;++y)
    for(let x=0;x<args.width;++x) {
      const i = (y*args.width+x)*4;

      if(
           x < 2 || x > args.width-3
        || y < 2 || y > args.height-3
      ) {
        BUFFER[i+0] = 0x00;
        BUFFER[i+1] = 0x00;
      } else {
        BUFFER[i+0] = Math.floor(x/args.width*256);
        BUFFER[i+1] = Math.floor(y/args.height*256);
      }

      BUFFER[i+2] = 0x00;
      BUFFER[i+3] = 0xAA;
    }

  return Buffer.from(BUFFER);
};

try {
  const pool = new pg.Pool({
    database:process.env.PGDATABASE,
    host:process.env.PGHOST,
    password:process.env.PGPASSWORD,
    port:process.env.PGPORT,
    user:process.env.PGUSER
  });

  const client = await pool.connect();

  for(let Y=0;Y<TILE_N;++Y) {
    for(let X=0;X<TILE_N;++X) {
      const filename = [ZOOM, Y, X].join('_') + '.png';
      console.log('filename', filename);

      const latitude_n = Math.atan(Math.sinh(Math.PI*(1-2*Y/TILE_N)))*180/Math.PI;
      const latitude_s = Math.atan(Math.sinh(Math.PI*(1-2*(Y+1)/TILE_N)))*180/Math.PI;
      const longitude_e = (X+1)/TILE_N*360-180;
      const longitude_w = X/TILE_N*360-180;

      console.log('  ', latitude_n, longitude_w, latitude_s, longitude_e);

      const a = [];

      for(let y=0;y<TILE_QUERY_HEIGHT_N;++y) {
        for(let x=0;x<TILE_QUERY_WIDTH_N;++x) {
          const wnes = [
            longitude_w+x/TILE_QUERY_WIDTH_N*(longitude_e-longitude_w),
            latitude_n+y/TILE_QUERY_HEIGHT_N*(latitude_s-latitude_n),
            longitude_w+(x+1)/TILE_QUERY_WIDTH_N*(longitude_e-longitude_w),
            latitude_n+(y+1)/TILE_QUERY_HEIGHT_N*(latitude_s-latitude_n)
          ];

          const wnesPolygon = [
            wnes[0], wnes[1],
            wnes[2], wnes[1],
            wnes[2], wnes[3],
            wnes[0], wnes[3],
            wnes[0], wnes[1]
          ];

          if(!a)
            a = [];

          a.push({ x, y, wnes, wnesPolygon });
        }
      }

      const ui32a = new Uint32Array(TILE_WIDTH*TILE_HEIGHT);
      console.log('ui32a.length', ui32a.length);

      // BIOMES
      console.time('query');
      const query = a.map(v => 'SELECT ' + v.x + ' AS x, ' + v.y + ' AS y, COUNT(accession), id FROM bgl_gp4326_wwf_tew WHERE ST_Intersects(lat_lon, ST_SetSRID(ST_GeomFromText(\'MULTIPOLYGON(((' + arrayChunk(v.wnesPolygon, 2).map(v => v.join(' ')).join(',') + ')))\'), 4326)) AND id IS NOT NULL GROUP BY id;').join('\n');
      const res = await client.query(query);
      console.timeEnd('query');

      for(const result of res)
        if(result.rows.length) {
          let color_i = parseInt(result.rows.sort((a, b) => parseInt(b.count)-parseInt(a.count))[0].id.slice(-2));

          if(color_i < COLOR_NUMBER.length) {
            for(let y=Math.floor(result.rows[0].y*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);y<Math.floor((result.rows[0].y+1)*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);++y)
              for(let x=Math.floor(result.rows[0].x*TILE_WIDTH/TILE_QUERY_WIDTH_N);x<Math.floor((result.rows[0].x+1)*TILE_WIDTH/TILE_QUERY_WIDTH_N);++x)
                ui32a[TILE_WIDTH*y+x] = COLOR_NUMBER[color_i+1];
          }
        }

      // for(const result of query)
      //   if(result.rows[0] && parseInt(result.rows[0].count)) {
      //     console.log('  count', result.rows[0].count);

      //     const color = COLOR_NUMBER[Math.floor(Math.random()*COLOR_NUMBER.length)];

      //     for(let y=Math.floor(result.rows[0].y*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);y<Math.floor((result.rows[0].y+1)*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);++y)
      //       for(let x=Math.floor(result.rows[0].x*TILE_WIDTH/TILE_QUERY_WIDTH_N);x<Math.floor((result.rows[0].x+1)*TILE_WIDTH/TILE_QUERY_WIDTH_N);++x)
      //         ui32a[TILE_WIDTH*y+x] = color;
      //   }

      const pngBuffer = await new Promise(resolve => {
        new Jimp(TILE_WIDTH, TILE_HEIGHT, (e, image) => {
          image.bitmap.data = Buffer.from(ui32a.buffer);
          
          resolve(image.getBufferAsync(Jimp.MIME_PNG));
        });
      });
      await writeFile(join(__dirname, '../data/raster/biomes.01', filename), pngBuffer);

      // BOUNDARIES
      // console.time('query');
      // const query = await client.query(a.map(v => 'SELECT ' + v.x + ' AS x, ' + v.y + ' AS y, id FROM geometry_multipolygon_4326 WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromText(\'MULTIPOLYGON(((' + arrayChunk(v.wnesPolygon, 2).map(v => v.join(' ')).join(',') + ')))\'), 4326));').join('\n'));
      // console.timeEnd('query');
      // for(const result of query)
      //   if(result.rows[0])
      //     for(let y=Math.floor(result.rows[0].y*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);y<Math.floor((result.rows[0].y+1)*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);++y)
      //       for(let x=Math.floor(result.rows[0].x*TILE_WIDTH/TILE_QUERY_WIDTH_N);x<Math.floor((result.rows[0].x+1)*TILE_WIDTH/TILE_QUERY_WIDTH_N);++x)
      //         ui32a[TILE_WIDTH*y+x] = 0xFF000000;

      // const pngBuffer = await new Promise(resolve => {
      //   new Jimp(TILE_WIDTH, TILE_HEIGHT, (e, image) => {
      //     image.bitmap.data = Buffer.from(ui32a.buffer);
          
      //     resolve(image.getBufferAsync(Jimp.MIME_PNG));
      //   });
      // });
      // await writeFile(join(__dirname, '../data/raster/boundaries', filename), pngBuffer);

      // POINTS
      // console.time('query');
      // const query = await client.query(a.map(v => 'SELECT ' + v.x + ' AS x, ' + v.y + ' AS y, COUNT(accession) FROM biosample_geographical_location WHERE ST_Intersects(lat_lon, ST_SetSRID(ST_GeomFromText(\'MULTIPOLYGON(((' + arrayChunk(v.wnesPolygon, 2).map(v => v.join(' ')).join(',') + ')))\'), 4326));').join('\n'));
      // console.timeEnd('query');

      // for(const result of query)
      //   if(result.rows[0] && parseInt(result.rows[0].count)) {
      //     console.log('  count', result.rows[0].count);

      //     for(let y=Math.floor(result.rows[0].y*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);y<Math.floor((result.rows[0].y+1)*TILE_HEIGHT/TILE_QUERY_HEIGHT_N);++y)
      //       for(let x=Math.floor(result.rows[0].x*TILE_WIDTH/TILE_QUERY_WIDTH_N);x<Math.floor((result.rows[0].x+1)*TILE_WIDTH/TILE_QUERY_WIDTH_N);++x)
      //         ui32a[TILE_WIDTH*y+x] = 0xFF0000FF;
      //   }

      // const pngBuffer = await new Promise(resolve => {
      //   new Jimp(TILE_WIDTH, TILE_HEIGHT, (e, image) => {
      //     image.bitmap.data = Buffer.from(ui32a.buffer);
          
      //     resolve(image.getBufferAsync(Jimp.MIME_PNG));
      //   });
      // });
      // await writeFile(join(__dirname, '../data/raster/points', filename), pngBuffer);

      // break;
    }

    // break;
  }

  await client.release();

  await pool.end();
} catch(e) {
  console.error(e);

  process.exit(1);  
}

// console.log(JSON.stringify(MultiPolygon));
