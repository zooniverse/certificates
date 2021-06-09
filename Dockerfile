FROM datasetteproject/datasette:0.57

# # why do i have to fix this?! - REMOVE!
# # https://github.com/simonw/datasette/pull/1296#issuecomment-819467759
# RUN mkdir -p /var/lib/apt
# RUN mkdir -p /var/lib/dpkg
# RUN mkdir -p /var/lib/dpkg/updates
# RUN mkdir -p /var/lib/dpkg/info
# RUN touch /var/lib/dpkg/status
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    # i shouldn't have to force these to use the new config but....
    apt-get -y upgrade -o Dpkg::Options::="--force-confnew" && \
    apt-get install --no-install-recommends -y \
    unzip \
    && \
    apt-get clean

WORKDIR /mnt/datasette

# Datasette tools
# for csv import - https://datasette.io/tools/csvs-to-sqlite
# for datasette db maniupluations and tools - https://datasette.io/tools/sqlite-utils
RUN pip install csvs-to-sqlite sqlite-utils

# Add the csv data files
COPY data/ .

# decompress the zip data folders
RUN unzip -o \*.zip

# our custom script for converting CSV files to database
COPY labs-import-csv-files-to-sqlite.sh /usr/local/bin/

# build the config dir
RUN /usr/local/bin/labs-import-csv-files-to-sqlite.sh
COPY settings.json ./databases/

CMD ["datasette", "-p", "80", "-h", "0.0.0.0", "--cors", "/mnt/datasette/databases"]
