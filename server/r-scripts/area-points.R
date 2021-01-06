needs(ncdf4)
needs(jsonlite)
attach(input[[1]])


r_input_path_nc -> path.nc_dir
r_input_filename -> filename.nc
r_input_ln1 -> ln1
r_input_ln2 -> ln2
r_input_lt1 -> lt1
r_input_lt2 -> lt2


nc <- nc_open(paste(path.nc_dir, filename.nc, sep = "/"))

lon <- ncvar_get(nc, "lon")
lat <- ncvar_get(nc, "lat")
time <- as.POSIXct(
  (ncvar_get(nc, "time")/24 - 2) * 86400,
  origin = as.Date("1/1/1"),
  tz="Asia/Dhaka"
)

nc_close(nc); rm(nc)


iLon <- which(lon > ln1 & lon < ln2); iLon <- (min(iLon)-2):(max(iLon)+2)
iLat <- which(lat > lt1 & lat < lt2); iLat <- (min(iLat)-2):(max(iLat)+2)


toJSON(list(
  filename = filename.nc,
  lon = lon[iLon],
  lat = lat[iLat],
  iLon = iLon,
  iLat = iLat
), auto_unbox = TRUE, pretty = TRUE)
