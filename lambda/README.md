# data

## logan_AWS_RDS_proxy

Lambda functions that proxies ```SELECT ...``` queries to the logan database
and returns the result as a JSON object.

The function is currently deployed [here](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/logan_AWS_RDS_proxy)
and made public through a function URL (currently [https://omdmrhz5lb2nrbmodjtm5fxhqq0uevzh.lambda-url.us-east-1.on.aws/](https://omdmrhz5lb2nrbmodjtm5fxhqq0uevzh.lambda-url.us-east-1.on.aws/)).

To use, send a POST request with a JSON payload to the function endpoint.
The payload should be an object with a single SELECT property set to the SQL
query string one needs to be performed against the dabatase.

If the query is succesful you will get back an array with all the rows in the
result set. Each row will be an object with keys as column names and values.

If the query is invalid or there is an error while executing it the response
should look like:

```{"error":"[ERROR MESSAGE]"}```

A very basic authentication scheme is in place. You should always set an
```Authorization: Bearer 20240516``` header on all requests, otherwise you will
get 403 Forbidden errors.

This is in place to prevent random bots from hitting our function and to make
sure whoever uses this had, at least, read this.

Example:

```
curl
  -H 'Authorization: Bearer 20240516'
  -H 'Content-Type':'application/json'
  -X POST
  -d '{"SELECT":"* FROM sra LIMIT 8"}'
  "[ENDPOINT]"
```

Output:
```
[
  {
    "acc":"SRR11121871",
    "assay_type":"AMPLICON",
    "center_name":"VETMEDUNI VIENNA",
    "consent":"public",
    "experiment":"SRX7758868",
    "sample_name":"vmu_te_IFLPS_K14T17",
    "instrument":"Illumina MiSeq",
    "librarylayout":"PAIRED",
    "libraryselection":"PCR",
    "librarysource":"METAGENOMIC",
    "platform":"ILLUMINA",
    "sample_acc":"SRS6178009",
    "biosample":"SAMN14143901",
    "organism":"bovine gut metagenome",
    "sra_study":"SRP250132",
    "releasedate":"2021-05-29T00:00:00.000Z",
    "bioproject":"PRJNA607677",
    "mbytes":17,"avgspotlen":429,"mbases":29,"library_name":"K14T17SARACow 1417",
    "biosamplemodel_sam":"Metagenome or environmental",
    "collection_date_sam":null,"geo_loc_name_country_calc":"Austria",
    "geo_loc_name_country_continent_calc":"Europe",
    "geo_loc_name_sam":"Austria: Pottenstein"
  },
  ... and so on ...
]
```

You can also do a simple GET request with the table name and a query to match
its primary key, to quickly get one record from the database.

Example:

```
curl
  -H 'Authorization: Bearer 20240516'
  "[ENDPOINT]"/sra/SRR11121871
```

... would return the first object of the previous example.

To learn about the tables that are available, check out [/table](../table).

### Things to improve:

 * Better authentication scheme, if needed
   It should be trivial to implement API keys.
 * Change the function endpoint to a more memorable (and static) domain.
 * GET only works for tables/columns that are explicitly defined.
   Make this work automatically so it works with all tables without any setup.
 * Return rows as an array without the column names save on bandwith.
