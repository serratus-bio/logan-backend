### Description

Raw copy of the `names.dmp` file of the NCBI taxonomy dataset.

See taxdump.tar.gz on [https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/).

### Columns

Column description was copied verbatim from the `readme.txt` file in the aforementioned archive.

| name | description |
| --- | --- |
| tax_id | the id of node associated with this name |
| name_txt | name itself |
| unique_name | the unique variant of this name if name not unique |
| name_class | (synonym, common name, ...) |

### Schema (SQL)

```sql
CREATE TABLE taxonomy_names (
  tax_id INTEGER,
  name_txt TEXT,
  unique_name TEXT,
  name_class TEXT
);
```

### Indexes (SQL)
```sql
CREATE INDEX idx_taxonomy_names_tax_id ON taxonomy_names(tax_id);
CREATE INDEX idx_taxonomy_names_name_class ON taxonomy_names(name_class);

ALTER TABLE taxonomy_names CLUSTER ON idx_taxonomy_names_name_class;
```

### Insert / Update

[NCBI_taxdump_upload_to_POSTGRES.js](../script/NCBI_taxdump_upload_to_POSTGRES.js)

Usage:

See [NCBI_taxdump_upload_to_POSTGRES.md](../script/NCBI_taxdump_upload_to_POSTGRES.md).
