### Description

NCBI BioProject accesion, name, title and description. Sourced from the [NCBI FTP site](https://ftp.ncbi.nlm.nih.gov/bioproject/).

See [NCBI BioProject Help](https://www.ncbi.nlm.nih.gov/books/NBK54016/).

### Columns

| name | description |
| --- | --- |
| **accession** | BioProject Accession. Five alpha-letters followed by one to six numbers. For example PRJNA43021. |
| **name** | Name of the project |
| **title** | Title of the project |
| **description** | Text description of the project (when provided) |

### Schema (SQL)

```sql
CREATE TABLE bioproject (
  accession TEXT PRIMARY KEY,
  name TEXT,
  title TEXT,
  description TEXT
);
```

### Indexes (SQL)

```sql
CREATE INDEX idx_bioproject_accession ON bioproject(accession);
```

### Insert / Update

TBD
