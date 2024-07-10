import pg from 'pg';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

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

  if(event.headers?.authorization !== 'Bearer 20240516')
    return { statusCode:401 };
  
  const path = event.requestContext.http.path.split(/\//);
  let query = undefined;
  
  switch(event.requestContext.http.method) {
    case 'GET':
      if(path.length !== 3)
        break;
    
      const table = path[1];
      // Allowed tables and views
      if(![
        'biosample',
        'logan_public',
        'sra'
      ].includes(table))
        break;
      
      // Primary keys
      const key = {
        biosample:'accession',
        logan_public:'acc',
        sra:'acc'
      }[table];
    
      if(!key)
        break;
      
      query = ['SELECT * FROM ' + table + ' WHERE ' + key + ' = $1 LIMIT 128', [path[2]]];
      break;
    case 'POST':
      if(path.length !== 2 || path[1])
        break;

      try {
        const body = JSON.parse(event.body);
        
        if(body?.SELECT)
          query = ['SELECT ' + body.SELECT.trim()];
      } catch {}
      break;
  }
  
  if(query === undefined)
    return { statusCode:400 };

  try {
    client = new pg.Client({
      database:process.env.PGDATABASE,
      host:process.env.PGHOST,
      password:process.env.PGPASSWORD,
      port:process.env.PGPORT,
      user:process.env.PGUSER
    });

    await client.connect();

    const result = await client.query.apply(client, query);

    const response = {
      headers:{
        'Access-Control-Allow-Headers':'*',
        'Access-Control-Allow-Methods':'*',
        'Access-Control-Allow-Origin':'*'
      },
      statusCode:200
    };

    if(result.rows) {
      response.body = JSON.stringify(result.rows);

      if(response.body.length > 1024 && event.headers?.['accept-encoding']?.toLowerCase().includes('gzip'))
        Object.assign(response, {
          body:(await promisify(gzip)(response.body)).toString('base64'),
          headers:Object.assign(response.headers, { 'Content-Encoding':'gzip' }),
          isBase64Encoded:true
        });
    }

    return response;
  } catch(e) {
    return {
      body:JSON.stringify({ error:e.message }),
      statusCode:500
    };
  } finally {
    if(client)
      await client.end();
  }
};
