### Description

Roughly, this table was generated as follows:

All geographical locations (lat/lon pairs) were inferred from attributes of [NCBI BioSample](https://www.ncbi.nlm.nih.gov/biosample/)s, using several geocoding providers. Source, [biosample_set.xml.gz](https://ftp.ncbi.nlm.nih.gov/biosample/biosample_set.xml.gz). Retrieved on 2024-06-28.

From the resolved coordinates we can calculate:

* **elevation**. Source, [ASTER Global Digital Elevation Model](https://cmr.earthdata.nasa.gov/search/concepts/C1711961296-LPCLOUD.html).

* **country**. Source, [opendatsoft, World Administrative Boundaries](https://public.opendatasoft.com/explore/dataset/world-administrative-boundaries/export/).

* **biome**. Source, [WWF Terrestrial Ecoregions of the World](https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world).

* **confidence**. Three different geocoding providers were used (AWS Esri, AWS HERE and Azure), a confidence scoring system was devised to rank the quality of these predictions. The confidence value goes from 0 to 6 and is calculated as [country confidence (0-3), +1 for each pair of predictions lying within the same country boundary] + [distance confidence (0-3), +1 for each pair of predictions within 8km of each other].

A compressed file (~8GB uncompressed) with a CSV dump of the whole table is available at S3, [biosample_geographical_location.202503.csv.gz](https://serratus-public.s3.us-east-1.amazonaws.com/geo/biosample_geographical_location.202503.csv.gz).

### Columns

| name | description |
| --- | --- |
| accession | BioSample accession |
| attribute_name | Attribute name from where lat_lon was inferred |
| attrbute_value | Attribute value used to infer lat_lon from |
| lat_lon | Location in the globe (latitude, longitude) following the WGS84 standard (4326 in postGIS) and encoded in WKB form |
| palm_virome | true if a viral palmprint is found on the BioSample (according to [serratus](https://serratus.io/)) |
| elevation | Height above mean sea level in meters (negative elevations are present) |
| center_name | true if a specific attrobute_value is predicted to describe a center name |
| country | Three letter code of the country whose the coordinate belongs to. Empty if no match to any country boundary. |
| biome | Major biome code according to WWF TEW (see above) |
| confidence | confidence value, higher is better |

### Schema (SQL)

```sql
CREATE TABLE biosample_geographical_location (
  accession TEXT,
  attribute_name TEXT,
  attribute_value TEXT,
  lat_lon GEOMETRY(POINT, 4326),
  palm_virome BOOLEAN,
  elevation NUMERIC,
  center_name BOOLEAN,
  country TEXT,
  biome TEXT,
  confidence NUMERIC
);
```

### Indexes (SQL)

```sql
CREATE INDEX idx_biosample_geographical_location_accession ON biosample_geographical_location(accession);
CREATE INDEX idx_biosample_geographical_location_attribute_name ON biosample_geographical_location(attribute_name);
CREATE INDEX idx_biosample_geographical_location_attribute_value ON biosample_geographical_location(attribute_value);
CREATE INDEX idx_biosample_geographical_location_lat_lon ON biosample_geographical_location USING GIST(lat_lon);
CREATE INDEX idx_biosample_geographical_location_palm_virome ON biosample_geographical_location(palm_virome);
CREATE INDEX idx_biosample_geographical_location_elevation ON biosample_geographical_location(elevation);
CREATE INDEX idx_biosample_geographical_location_center_name ON biosample_geographical_location(center_name);
CREATE INDEX idx_biosample_geographical_location_country ON biosample_geographical_location(country);
CREATE INDEX idx_biosample_geographical_location_biome ON biosample_geographical_location(biome);
```

### Insert / Update

Last update was made on March 23, 2025.

### Notes

The `palm_virome` column was generated and retrofitted manually.

To convert WKB to WKT, one could use a tool like [wktmap](https://wktmap.com/). As an example, if we paste `0101000020E610000024D3A1D3F37954C0E318C91EA1C34240`, the page will automatically convert WKB to WKT and display the result on the textbox and the map.

To do this programatically, one could use may of the GIS libraries that exist for their preferred programming language.
