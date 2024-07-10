# data

## logan_AWS_RDS_proxy

Lambda functions that proxies ```SELECT ...``` queries to the logan database
and returns the result as a JSON object.

The function is currently deployed [here](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/logan_AWS_RDS_proxy)
and made public through a function URL.

Endpoint: [https://omdmrhz5lb2nrbmodjtm5fxhqq0uevzh.lambda-url.us-east-1.on.aws/](https://omdmrhz5lb2nrbmodjtm5fxhqq0uevzh.lambda-url.us-east-1.on.aws/)

A very basic authentication scheme is in place. You should always set an
```Authorization: Bearer 20240516``` header on all requests, otherwise you will
get 403 Forbidden errors.

To use, send a POST request with a JSON payload to the function endpoint.
The payload should be an object with a single **SELECT** property set to the SQL
query string one needs to be performed against the dabatase.

If the query is succesful you will get back an array with all the rows in the
result set. Each row will be an object with keys as column names and values.

If the query is invalid or there is an error while executing it the response
should look like:

```{"error":"[ERROR MESSAGE]"}```

Example:

```
curl \
  -H 'Authorization: Bearer 20240516' \
  -H 'Content-Type':'application/json' \
  -X POST \
  -d '{"SELECT":"* FROM sra LIMIT 8"}' \
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
curl \
  -H 'Authorization: Bearer 20240516' \
  "[ENDPOINT]"/sra/SRR11121871
```

... would return the first object of the previous example.

To learn about the tables that are available, check out [table](../table).

### Things to improve

 * Change the function endpoint to a more memorable (and static) domain.
 * Better authentication scheme, if needed
   It should be trivial to implement API keys.
 * GET only works for tables/columns that are explicitly defined.
   Make this work automatically so it works with all tables without any setup.
 * Return rows as an array without the column names save on bandwith.


## logan_AWS_RDS_proxy

Retrieves individual contigs from SRA assembly resources on s3://logan-pub.

The function is currently deployed [here](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/logan_get_contig)
and made public through a function URL.

Endpoint: [https://ag63ar36qwfndxxfc32b3w57oy0wcugc.lambda-url.us-east-1.on.aws/](https://ag63ar36qwfndxxfc32b3w57oy0wcugc.lambda-url.us-east-1.on.aws/)

A very basic authentication scheme is in place. You should always set an
```Authorization: Bearer 20240522``` header on all requests, otherwise you will
get 403 Forbidden errors.

To use, send a POST request with a JSON payload to the function endpoint.
The payload should be an object with two properties:

 * **SRA**:
   [SRA](https://www.ncbi.nlm.nih.gov/sra) id of the library you want to use
 * **contig**:
   A string (or array of strings) with the contig ids that you wish to extract

Example:
```
curl \
  -H 'Authorization: Bearer 20240522' \
  -H 'Content-Type':'application/json' \
  -X POST \
  -d '{"SRA":"DRR000001","contig":["DRR000001_1","DRR000001_2"]}' \
  "[ENDPOINT]"
```

Output:
```
>DRR000001_1 ka:f:17.316   L:+:722:+  L:-:1565:- 
AGTGTCTT[...]
>DRR000001_2 ka:f:17.782   L:+:392:- L:+:2311:-  L:-:1220:+ 
CCGGCACT[...]
```

You can also do a simple GET request with an SRA id and a single contig id,
to quickly fetch it from the S3 repository.

Example:
```
curl \
  -H 'Authorization: Bearer 20240522' \
  "[ENDPOINT]"/DRR000001/DRR000001_1
```

... would return the first contig of the previous example.

### Things to improve

 * Change the function endpoint to a more memorable (and static) domain.
 * Use Anton's [f2sz](https://github.com/asl/f2sz)
 * Reverse complement and other minimal transform functions as long as they
   do not require external libraries.
