### Description

For every `tax_id`, a lineage tree is computed according to the graph described
on `nodes.tmp` of the NCBI taxonomy dataset.

An example lineage tree for [Pantherophis obsoletus (tax_id:39099)](https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=39099) looks like:

```
Eukaryota (Superkingdom)
⤷ Opisthokonta (Clade)
  ⤷ Metazoa (Kingdom)
    ⤷ Eumetazoa (Clade)
      ⤷ Bilateria (Clade)
        ⤷ Deuterostomia (Clade)
          ⤷ Chordata (Phylum)
            ⤷ Craniata (Subphylum)
              ⤷ Vertebrata (Clade)
                ⤷ Gnathostomata (Clade)
                  ⤷ Teleostomi (Clade)
                    ⤷ Euteleostomi (Clade)
                      ⤷ Sarcopterygii (Superclass)
                        ⤷ Dipnotetrapodomorpha (Clade)
                          ⤷ Tetrapoda (Clade)
                            ⤷ Amniota (Clade)
                              ⤷ Sauropsida (Clade)
                                ⤷ Sauria (Clade)
                                  ⤷ Lepidosauria (Class)
                                    ⤷ Squamata (Order)
                                      ⤷ Bifurcata (Clade)
                                        ⤷ Unidentata (Clade)
                                          ⤷ Episquamata (Clade)
                                            ⤷ Toxicofera (Clade)
                                              ⤷ Serpentes (Infraorder)
                                                ⤷ Colubroidea (Superfamily)
                                                  ⤷ Colubridae (Family)
                                                    ⤷ Colubrinae (Subfamily)
                                                      ⤷ Pantherophis (Genus)
                                                        ⤷ Pantherophis obsoletus (Species)
```

Then, the specific ranks for each of the columns described below are picked
and stored in the table. If there's no information at that level of the
hierarchy, the column value is `NULL`.

### Columns

| name | description |
| --- | --- |
| tax_id | node id in GenBank taxonomy database |
| superkingdom | superkingdom name |
| kingdom | kingdom name |
| phylum | phylum name |
| class | class name |
| order | order name |
| family | family name |
| genus | genus name |
| species | species name |

### Schema (SQL)

```sql
CREATE TABLE taxonomy_lineage (
  "tax_id" INTEGER,
  "superkingdom" TEXT,
  "kingdom" TEXT,
  "phylum" TEXT,
  "class" TEXT,
  "order" TEXT,
  "family" TEXT,
  "genus" TEXT,
  "species" TEXT
);
```

### Indexes (SQL)
```sql
CREATE INDEX idx_taxonomy_lineage_tax_id ON taxonomy_lineage(tax_id);
```

### Insert / Update

[NCBI_taxdump_upload_to_POSTGRES.js](../script/NCBI_taxdump_upload_to_POSTGRES.js)

**Usage**

See [NCBI_taxdump_upload_to_POSTGRES.md](../script/NCBI_taxdump_upload_to_POSTGRES.md).
