### Description

Raw copy of (most of the columns in the) SRA metadata, fetched from BigQuery.

See, [NCBI documentation site](https://www.ncbi.nlm.nih.gov/sra/docs/sra-cloud-based-metadata-table/).

### Columns

*Description was copied verbatim from the NCBI documentation site.*

| name | description |
| --- | --- |
| **acc** | SRA Run accession in the form of SRR######## (ERR or DRR for INSDC partners) |
| **assay_type** | Type of library (i.e. AMPLICON, RNA-Seq, WGS, etc) |
| **center_name** | Name of the sequencing center |
| **consent** | Type of consent need to access the data (i.e. public is available to all, others are for dbGaP) |
| **experiment** | The accession in the form of SRX######## (ERX or DRX for INSDC partners) |
| **sample_name** | Name of the sample |
| **instrument** | Name of the sequencing instrument model |
| **librarylayout** | Whether the data is SINGLE or PAIRED |
| **libraryselection** | Library selection methodology (i.e. PCR, RANDOM, etc) |
| **librarysource** | Source of the biological data (i.e. GENOMIC, METAGENOMIC, etc) |
| **platform** | Name of the sequencing platform (i.e. ILLUMINA) |
| **sample_acc** | SRA Sample accession in the form of SRS######## (ERS or DRS for INSDC partners) |
| **biosample** | BioSample accession in the form of SAMN######## (SAMEA##### or SAMD##### for INSDC partners) |
| **organism** | Scientific name of the organism that was sequenced (as found in the NCBI Taxonomy Browser) |
| **sra_study** | SRA Study accession in the form of SRP######## (ERP or DRP for INSDC partners) |
| **releasedate** | The date on which the data was released |
| **bioproject** | BioProject accession in the form of PRJNA######## (PRJEB####### or PRJDB###### for INSDC partners) |
| **mbytes** | Number of mega bytes of data in the SRA Run |
| **avgspotlen** | Calculated average read length |
| **mbases** | Number of mega bases in the SRA Runs |
| **library_name** | The name of the library |
| **biosamplemodel_sam** | The BioSample package/model that was picked |
| **collection_date_sam** | The collection date of the sample |
| **geo_loc_name_country_calc** | Name of the country where the sample was collected |
| **geo_loc_name_country_continent_calc** | Name of the continent where the sample was collected |
| **geo_loc_name_sam** | Full location of collection |

### Schema (SQL)

```sql
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
```

### Indexes (SQL)
```
CREATE INDEX idx_sra_acc ON sra(acc);
CREATE INDEX idx_sra_biosample ON sra(biosample);
CREATE INDEX idx_sra_bioproject ON sra(bioproject);
```

### How to create/update

script ...
