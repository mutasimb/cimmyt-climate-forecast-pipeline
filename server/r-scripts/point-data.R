needs(ncdf4)
needs(jsonlite)
attach(input[[1]])


r_input_path_nc -> path.nc_dir
r_input_filename -> filename.nc
r_input_lon_index -> i.lon
r_input_lat_index -> i.lat


nc <- nc_open(paste(path.nc_dir, filename.nc, sep = "/"))

lon <- ncvar_get(nc, "lon")
lat <- ncvar_get(nc, "lat")

t2m <- ncvar_get(nc, "t2m")
prec <- ncvar_get(nc, "prec")
rh2m <- ncvar_get(nc, "rh2m")

nc_close(nc); rm(nc)


toJSON(list(
  filename = filename.nc,
  lon = lon[i.lon],
  lat = lat[i.lat],
  t2m = t2m[i.lon, i.lat,],
  prec = prec[i.lon, i.lat,],
  rh2m = rh2m[i.lon, i.lat,]
), auto_unbox = TRUE, pretty = TRUE)
