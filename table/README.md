# table

*All tables/views in the database should have a file here with (at least):*

 * *Overall description with origin of the data*
 * *A list of their columns with their description*
 * *SQL commands to create the table schema*
 * *SQL commands to create the column indexes*
 * *How to insert and/or update the records in the table*

 ---

## Credentials

|     |     |
| --- | --- |
| hostname | serratus-aurora-20210406.cluster-ro-ccz9y6yshbls.us-east-1.rds.amazonaws.com |
| database | logan |
| username | open_virome |
| password | open_virome |

## Dirty Tables/Views

* **palm_virome**

  Raw copy of `palm_virome` from serratus on July 19, 2024.
  Indexes on `run`, `bio_sample`, `bio_project`.

* **biosample_tissue**

  Raw copy of `biosample_tissue` from serratus on July 19, 2024.
  Indexes on `biosample_id`.

* **sra_stat**

  Raw copy of `sra_stat` from serratus on July 19, 2024.
  Indexes on `run`, `taxid`.


## Tables

* [bioproject](bioproject.md) [MISSING DOCUMENTATION]
* [biosample](biosample.md) [MISSING DOCUMENTATION]
* [biosample_geographical_location](biosample_geographical_location.md)
* [geometry_multipolygon_4326](geometry_multipolygon_4326.md) [MISSING DOCUMENTATION]
* [geometry_polygon_4326_wwf_tew](geometry_polygon_4326_wwf_tew.md) [MISSING DOCUMENTATION]
* [sra](sra.md)
* [taxonomy_names](taxonomy_names.md)
* [taxonomy_lineage](taxonomy_lineage.md)
* [taxonomy_nodes](taxonomy_nodes.md)

## Materialized Views

* [bgl_gm4326](bgl_gm4326.md) [MISSING DOCUMENTATION]
* [bgl_gp4326_wwf_tew](bgl_gp4326_wwf_tew.md) [MISSING DOCUMENTATION]

## Notes

* **biosample_geographical_location**

  The `palm_virome` column was generated and retrofitted manually.
