# table

## Dirty Tables/Views

* **palm_virome**

  Raw copy of `palm_virome` from serratus on July 19, 2024.
  Indexes on `run`, `bio_sample`, `bio_project`.

## Tables

* [bioproject](bioproject.md)
* [biosample](biosample.md)
* [biosample_geographical_location](biosample_geographical_location.md)
* [geometry_multipolygon_4326](geometry_multipolygon_4326.md)
* [geometry_polygon_4326_wwf_tew](geometry_polygon_4326_wwf_tew.md)
* [sra](sra.md)
* [taxonomy_names](taxonomy_names.md)
* [taxonomy_lineage](taxonomy_lineage.md)
* [taxonomy_nodes](taxonomy_nodes.md)

## Materialized Views

* [bgl_gm4326](bgl_gm4326.md)
* [bgl_gp4326_wwf_tew](bgl_gp4326_wwf_tew.md)

## Guidelines

All tables/views in the database should have a file here with (at least):

 * Overall description with origin of the data
 * A list of their columns with their description
 * SQL commands to create the table schema
 * SQL commands to create the column indexes
 * How to insert and/or update the records in the table
