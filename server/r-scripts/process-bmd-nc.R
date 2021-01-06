needs(ncdf4)
needs(jsonlite)
attach(input[[1]])


r_input_path_nc_file -> path.downloaded_nc
r_input_path_download -> path.download_dir
r_input_path_nc_dir -> path.nc_dir


constants <- list(
  bbox.bgd = list(ln.min = 88.01057, ln.max = 92.67366, lt.min = 20.74111, lt.max = 26.63407),
  degree.padding = 2.5
)

filename.input_nc <- gsub(paste0(path.download_dir, '/'), '', path.downloaded_nc)
time.base <- strptime(filename.input_nc, "%Y%m%d%H_d01.nc.subset", tz = "GMT")
filename.output_nc <- gsub(" \\+06", "", as.character(format(
  as.POSIXct(time.base),
  "bmd_forecast_%Y%m%d_d01.nc",
  tz = "Asia/Dhaka",
  usetz = TRUE
)))
path.output_nc <- paste(path.nc_dir, filename.output_nc, sep = "/")


nc.sample <- nc_open(if(
  dir.exists("C:/_data/bmd_models_output/")
) "C:/_data/bmd_models_output/20200818/00/2020081800_d01.nc" else "/home/csrd/bmd_highres/_misc/20200824/18/2020082418_d01.nc")
lat <- ncvar_get(nc.sample, 'XLAT')
lon <- ncvar_get(nc.sample, 'XLONG')
nc_close(nc.sample)


nc.bmd <- nc_open(path.downloaded_nc)

nc.ln <- lon[,1,1]
nc.lt <- lat[1,,1]
length.time <- nc.bmd$dim$Time$len

nc.ln.index <- sapply(nc.ln[nc.ln > (constants$bbox.bgd$ln.min - constants$degree.padding) & nc.ln < (constants$bbox.bgd$ln.max + constants$degree.padding)], function(x) which(x == nc.ln))
nc.lt.index <- sapply(nc.lt[nc.lt > (constants$bbox.bgd$lt.min - constants$degree.padding) & nc.lt < (constants$bbox.bgd$lt.max + constants$degree.padding)], function(x) which(x == nc.lt))

nc.t2m <- ncvar_get(nc.bmd, "t2m")
nc.prec <- ncvar_get(nc.bmd, "prec")
nc.rh2m <- ncvar_get(nc.bmd, "rh2m")

ncdim.lon <- ncdim_def("lon", "degrees_east", nc.ln[nc.ln.index])
ncdim.lat <- ncdim_def("lat", "degrees_north", nc.lt[nc.lt.index])
# ncdim.time <- ncdim_def("time", nc.bmd$var$TIME$units, nc.tm)
ncdim.time <- ncdim_def("time", "hours since 1-1-1 00:00:00", sapply(
  seq(length.time)-1,
  function(x) as.numeric(time.base + x * 3600 - ISOdatetime(1, 1, 1, 0, 0, 0, tz = "GMT")) * 24 + 48)
)

ncvar.t2m <- ncvar_def("t2m", "deg_C", list(ncdim.lon, ncdim.lat, ncdim.time), nc.bmd$var$t2m$missval, "Temperature (at 2 m above ground)", nc.bmd$var$t2m$prec)
ncvar.prec <- ncvar_def("prec", "mm", list(ncdim.lon, ncdim.lat, ncdim.time), nc.bmd$var$prec$missval, "Total Rainfall", nc.bmd$var$prec$prec)
ncvar.rh2m <- ncvar_def("rh2m", "%", list(ncdim.lon, ncdim.lat, ncdim.time), nc.bmd$var$rh2m$missval, "Relative Humidity (at 2 m above ground)", nc.bmd$var$rh2m$prec)

nc_close(nc.bmd)


nc <- nc_create(path.output_nc, list(ncvar.t2m, ncvar.prec, ncvar.rh2m), force_v4 = TRUE)

ncvar_put(nc, ncvar.t2m, nc.t2m[nc.ln.index, nc.lt.index,])
ncvar_put(nc, ncvar.prec, nc.prec[nc.ln.index, nc.lt.index,])
ncvar_put(nc, ncvar.rh2m, nc.rh2m[nc.ln.index, nc.lt.index,])

nc_close(nc)


toJSON(list(
  input = filename.input_nc,
  output = path.output_nc
), auto_unbox = TRUE)
