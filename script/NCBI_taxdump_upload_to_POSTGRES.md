### Usage

Set up the following environment variables to its proper values:

 * ```PGDATABASE```
 * ```PGHOST```
 * ```PGPASSWORD```
 * ```PGPORT```
 * ```PGUSER```

Download and extract the [taxdump.tar.gz](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/) from the NCBI taxonomy dataset.

Set the NCBI_TAXDUMP_PATH variable at the top of the script to the directory
where you extracted this file.

```
const NCBI_TAXDUMP_PATH = join(__dirname, '../data/taxdump');
```

Then run:

```
node script/NCBI_taxdump_upload_to_POSTGRES.js
```

Note: this script **INSERT**s rows into the tables.
Make sure they're empty before running it.

### Output
```
taxonomy_names
# of records processed: [taxonomy_names:4,080,968]  2m28s
taxonomy_nodes
# of records processed: [taxonomy_names:4,080,968, taxonomy_nodes:2,597,905]  4m06s
taxonomy_lineage
# of records processed: [taxonomy_names:4,080,968, taxonomy_nodes:2,597,905, taxonomy_lineage:2,597,905]  5m54s
```
