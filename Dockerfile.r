FROM r-base:4.2.3
WORKDIR /app

# Install base dependencies
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libxt-dev \
    libjpeg-dev \
    libpng-dev \
    && Rscript -e "install.packages(c('plotly', 'htmlwidgets', 'readr', 'ggplot2'), repos='https://cloud.r-project.org')"

CMD ["Rscript"]
