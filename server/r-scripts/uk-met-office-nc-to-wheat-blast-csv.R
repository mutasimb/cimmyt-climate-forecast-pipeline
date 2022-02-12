needs(jsonlite)
needs(ncdf4)
attach(input[[1]])

r_input_path_nc_file -> path.nc
r_input_path_wb_dir -> path.dir
r_input_date_str -> str.date


nc <- nc_open(path.nc)

nc.ln <- ncvar_get(nc, 'lon')
nc.lt <- ncvar_get(nc, 'lat')
nc.tm <- format(
  as.POSIXct(
    (ncvar_get(nc, 'time') - 48) * 3600,
    origin = "1-1-1 00:00"
  ),
  "%Y%m%d%H"
)

nc.t2m  <- ncvar_get(nc, "t2m")
nc.prec <- ncvar_get(nc, "prec")
nc.rh2m <- ncvar_get(nc, "rh2m")

nc_close(nc); rm(nc)


df <- data.frame(lon = rep(nc.ln, length(nc.lt)), lat = rep(nc.lt, each = length(nc.ln)))

for(t in seq_along(nc.tm)) df[paste("t2m", nc.tm[t], sep = "_")] <- round(as.numeric(nc.t2m[,,t]), digits = 2); rm(t)
for(t in seq_along(nc.tm)) df[paste("prec", nc.tm[t], sep = "_")] <- round(as.numeric(nc.prec[,,t]), digits = 2); rm(t)
for(t in seq_along(nc.tm)) df[paste("rh2m", nc.tm[t], sep = "_")] <- round(as.numeric(nc.rh2m[,,t]), digits = 2); rm(t)

path.csv <- paste(
  path.dir,
  sprintf("uk-met-office_global-10km_utc-1200_%s.csv", str.date),
  sep = "/"
)

write.csv(df, path.csv, row.names = FALSE)

toJSON(list(pathGeneratedCSV = path.csv), auto_unbox = TRUE)
