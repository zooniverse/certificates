## Installation

Use docker and docker-compose, no other way is supported

## Getting Started

## Convert source data files to a working zip format

Only use do this if you are adding new data files to this system.

Use the following cmd format the zip files correctly

``` bash
zip -r $project_name.zip $project_csv_file_dir/
```

## Running the HTML Certificate UI

All the static assets `index.html` and `loadUserStats.js` files are in the [Static Directory](./static/)

These are served via an nginx service in the `docker-compose.yaml`. To launch the index.html in your browser do the following
```
docker-compose up
```
Visit the page via http://localhost:8000/ :tada:

## Running the Workflow Session Times API

### Use custom docker image to build the dbs

The following will build a sqlite db for each directory containing csv files in the `/data/` directory of this repository

``` bash
docker-compose build
```

### Run Datasette with the built sql databases from above

``` bash
docker-compose up
```

This will start datasette and serve all the newly created files at http://127.0.0.1:8001

See docker-compose.yaml for more information

### Run SQL queires directly against the databases

JSON format
- http://127.0.0.1:8001/sessions.json?sql=select+*+from+stats+where+workflow_id+=+12008&_shape=objects

HTML format
- http://127.0.0.1:8001/sessions?sql=select+*from+stats+limit+10

### Manually interact with the sqlite db or datasette via bash

``` bash
docker-compose run --rm --service-ports datasette bash
# do what you want on the file system
#
# re-run the builder script manually
labs-import-csv-files-to-sqlite.sh
#
# use sqlite repl to interact with the database.db file
sqlite3 /mnt/databases/folder/database.db
#
# start datasette in config directoy & cors mode
datasette -h 0.0.0.0 --cors ./databases
```
