# Database Setup

(Assuming a clean postgres instance, and a user with enough privileges)

### Create the database
```
CREATE DATABASE logan;

CREATE EXTENSION postgis;
```

### Create the tables

#### BioProject
```
CREATE TABLE bioproject (accession TEXT PRIMARY KEY, name TEXT, title TEXT, description TEXT);

CREATE INDEX idx_bioproject_accession ON bioproject(accession);
```

#### BioSample
```
CREATE TABLE biosample (accession TEXT PRIMARY KEY, title TEXT);

CREATE INDEX idx_biosample_accession ON biosample(accession);
```

#### BioProject x BioSample
```
CREATE TABLE bioproject_biosample (bioproject_accession TEXT, biosample_accession TEXT);

CREATE INDEX idx_bioproject_biosample_bioproject_accession ON bioproject_biosample(bioproject_accession);
CREATE INDEX idx_bioproject_biosample_biosample_accession ON bioproject_biosample(biosample_accession);
```

### BioSample (Geographical Location)
```
CREATE TABLE biosample_geographical_location (accession TEXT, attribute_name TEXT, attribute_value TEXT, lat_lon GEOMETRY(POINT, 4326));

CREATE INDEX idx_biosample_geographical_location_accession ON biosample_geographical_location(accession);
CREATE INDEX idx_biosample_geographical_location_lat_lon ON biosample_geographical_location USING GIST (lat_lon);
```

### Geometry Multipolygon 4326
```
CREATE TABLE geometry_multipolygon_4326 (id TEXT, type TEXT, name TEXT, geom GEOMETRY(MULTIPOLYGON, 4326));

CREATE INDEX idx_geometry_multipolygon_4326_geom ON geometry_multipolygon_4326 USING GIST (geom);
```

### Geometry Polygon 4326 (WWF_TEW)
```
CREATE TABLE geometry_polygon_4326_wwf_tew (id TEXT, type TEXT, name TEXT, geom GEOMETRY(POLYGON, 4326));

CREATE INDEX idx_geometry_polygon_4326_wwf_tew_geom ON geometry_polygon_4326_wwf_tew USING GIST (geom);
```

#### SRA
```
CREATE TABLE sra (
  acc TEXT PRIMARY KEY,
  assay_type TEXT,
  center_name TEXT,
  consent TEXT,
  experiment TEXT,
  sample_name TEXT,
  instrument TEXT,
  librarylayout TEXT,
  libraryselection TEXT,
  librarysource TEXT,
  platform TEXT,
  sample_acc TEXT,
  biosample TEXT,
  organism TEXT,
  sra_study TEXT,
  releasedate TIMESTAMP,
  bioproject TEXT,
  mbytes INTEGER,
  avgspotlen INTEGER,
  mbases INTEGER,
  library_name TEXT,
  biosamplemodel_sam TEXT,
  collection_date_sam DATE,
  geo_loc_name_country_calc TEXT,
  geo_loc_name_country_continent_calc TEXT,
  geo_loc_name_sam TEXT
);

CREATE INDEX idx_sra_acc ON sra(acc);
CREATE INDEX idx_sra_biosample ON sra(biosample);
CREATE INDEX idx_sra_bioproject ON sra(bioproject);
```

### Create the materialized views

#### bgl_gm4326
```
CREATE MATERIALIZED VIEW bgl_gm4326
AS SELECT biosample_geographical_location.*, geometry_multipolygon_4326.id
  FROM biosample_geographical_location
  LEFT JOIN geometry_multipolygon_4326 ON ST_Intersects(biosample_geographical_location.lat_lon, geometry_multipolygon_4326.geom)
WITH NO DATA;

CREATE INDEX idx_bgl_gm4326_accession ON bgl_gm4326(accession);
CREATE INDEX idx_bgl_gm4326_lat_lon ON bgl_gm4326 USING GIST (lat_lon);
CREATE INDEX idx_bgl_gm4326_id ON bgl_gm4326(id);
```

```
REFRESH MATERIALIZED VIEW bgl_gm4326;
```
Runs
  ~380 minutes
  ~220 minutes (July 4)
SSL SYSCALL error: EOF detected
The connection to the server was lost. Attempting reset: Failed.
Time: 15727446.291 ms (04:22:07.446)

#### bgl_gp4326_wwf_tew
```
CREATE MATERIALIZED VIEW bgl_gp4326_wwf_tew
AS SELECT biosample_geographical_location.*, geometry_polygon_4326_wwf_tew.id
  FROM biosample_geographical_location
  LEFT JOIN geometry_polygon_4326_wwf_tew ON ST_Intersects(biosample_geographical_location.lat_lon, geometry_polygon_4326_wwf_tew.geom)
WITH NO DATA;

CREATE INDEX idx_bgl_gp4326_wwf_tew_accession ON bgl_gp4326_wwf_tew(accession);
CREATE INDEX idx_bgl_gp4326_wwf_tew_lat_lon ON bgl_gp4326_wwf_tew USING GIST (lat_lon);
CREATE INDEX idx_bgl_gp4326_wwf_tew_id ON bgl_gp4326_wwf_tew(id);
```

```
REFRESH MATERIALIZED VIEW bgl_gp4326_wwf_tew;
```
Runs
  ~720 minutes
  ~530 minutes (July 4)


#### logan_public
```
CREATE MATERIALIZED VIEW logan_public
AS SELECT sra.acc, sra.biosample, biosample.lat_lon
  FROM sra
  LEFT JOIN biosample on sra.biosample = biosample.accession
WITH NO DATA;

CREATE INDEX idx_logan_public_acc ON logan_public(acc);
```

```
REFRESH MATERIALIZED VIEW logan_public;
```
Takes ~4 minutes.

7,905,168

### Fetch and insert data to the SRA table

First thing you want to do is download a list of all SRA IDs.

src/sra_fetch_id_list

Then run <some other script> to put this into the required tables

<upload SRA to AWS RDS>

Download a copy of biosample.xml.gz

Parse and generate CSV for the location data

<sort uniq for the first column>
  cat ... | { sed -u 1q; sort -k 1,1 -t , -u ... }
  ^^^^ this should be handled differently, multiple coordinates should be valid

<upload BioSample to AWS RDS>

Create an AWS Lambda function:
  * with a public HTTPS endpoint
  * 4 seconds timeout (if we need more time then maybe the queyr has to be planned differently)

Deploy the logan AWS RDS Proxy

Update the environment variables
  PGDATABASE
  PGHOST
  PGPASSWORD
  PGPORT
  PGUSER
