### Description

Raw copy of the `nodes.dmp` file of the NCBI taxonomy dataset.

See taxdump.tar.gz on [https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/).

### Columns

Column description was derived from the `readme.txt` file in the aforementioned archive.

| name | description |
| --- | --- |
| tax_id | node id in GenBank taxonomy database |
| parent_tax_id | parent node id in GenBank taxonomy database |
| rank | rank of this node (superkingdom, kingdom, ...) |
| embl_code | locus-name prefix; not unique |
| division_id | see division.dmp file |
| inherited_div_flag | true if node inherits division from parent |
| genetic_code_id | see gencode.dmp file |
| inherited_gc_flag | true if node inherits genetic code from parent |
| mitochondrial_genetic_code_id | see gencode.dmp file |
| inherited_mgc_flag | true if node inherits mitochondrial gencode from parent |
| genbank_hidden_flag | true if name is suppressed in GenBank entry lineage |
| hidden_subtree_root_flag | true if this subtree has no sequence data yet |
| comments | free-text comments and citations |

### Schema (SQL)

```sql
CREATE TABLE taxonomy_nodes (
  tax_id INTEGER,
  parent_tax_id INTEGER,
  rank TEXT,
  embl_code TEXT,
  division_id INTEGER,
  inherited_div_flag BOOLEAN,
  genetic_code_id INTEGER,
  inherited_gc_flag BOOLEAN,
  mitochondrial_genetic_code_id INTEGER,
  inherited_mgc_flag BOOLEAN,
  genbank_hidden_flag BOOLEAN,
  hidden_subtree_root_flag BOOLEAN,
  comments TEXT
);
```

### Indexes (SQL)
```sql
CREATE INDEX idx_taxonomy_nodes_tax_id ON taxonomy_nodes(tax_id);
```

### Insert / Update

[NCBI_taxdump_upload_to_POSTGRES.js](../script/NCBI_taxdump_upload_to_POSTGRES.js)

**Usage**

See [NCBI_taxdump_upload_to_POSTGRES.md](../script/NCBI_taxdump_upload_to_POSTGRES.md).
