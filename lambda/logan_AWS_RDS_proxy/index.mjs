import pg from 'pg';
import { promisify } from 'node:util';
import { constants, gzip, inflate } from 'node:zlib';

const AWS_LAMBDA_TIMEOUT = 8192;

export const handler = async event => {
  let client = undefined;

  if(event.requestContext.http.method === 'OPTIONS')
    return {
      headers:{
        'Access-Control-Allow-Headers':'*',
        'Access-Control-Allow-Methods':'*',
        'Access-Control-Allow-Origin':'*'
      },
      statusCode:200
    };

  try {
    let query = undefined;

    const body = JSON.parse(event.body);
    
    if(body?.deflate)
      body.SELECT = String(await promisify(inflate)(Buffer.from(body.SELECT, 'base64')));
    
    if(body?.SELECT)
      query = [{ text:'SELECT ' + body.SELECT.trim() }];

    if(body?.array)
      query[0].rowMode = 'array';
  
    if(query === undefined)
      return { statusCode:400 };

    client = new pg.Client({
      database:process.env.PGDATABASE,
      host:process.env.PGHOST,
      password:process.env.PGPASSWORD,
      port:process.env.PGPORT,
      user:process.env.PGUSER
    });

    await client.connect();

    const result = await Promise.race([
      (async () => {
        try {
          return await client.query.apply(client, query);
        } catch(e) { console.error(e); }
      })(),
      new Promise(resolve => setTimeout(() => resolve({ error:'TIMEOUT' }), AWS_LAMBDA_TIMEOUT-256))
    ]);

    const response = {
      headers:{
        'Access-Control-Allow-Headers':'*',
        'Access-Control-Allow-Methods':'*',
        'Access-Control-Allow-Origin':'*'
      },
      statusCode:200
    };

    if(result.error)
      response.body = JSON.stringify({ error:result.error });
    else if(result.rows) {
      response.body = JSON.stringify({ result:result.rows });

      if(response.body.length > 1024 && event.headers?.['accept-encoding']?.toLowerCase().includes('gzip'))
        Object.assign(response, {
          body:(await promisify(gzip)(response.body, { level:constants.Z_BEST_SPEED })).toString('base64'),
          headers:Object.assign(response.headers, { 'Content-Encoding':'gzip' }),
          isBase64Encoded:true
        });
    }

    return response;
  } catch(e) {
    console.error(e);

    return {
      body:JSON.stringify({ error:e.message }),
      statusCode:500
    };
  } finally {
    if(client)
      await client.end();
  }
};
