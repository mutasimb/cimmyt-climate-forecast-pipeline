needs(ncdf4)
needs(jsonlite)
attach(input[[1]])


r_input_path_nc_file -> path.downloaded_nc
r_input_path_output_csv -> path.output_csv


constants <- list(
  bbox.bgd = list(ln.min = 88.01057, ln.max = 92.67366, lt.min = 20.74111, lt.max = 26.63407),
  degree.padding = 2.5
)


filename.input_nc <- rev(strsplit(path.downloaded_nc, '/')[[1]])[1]
time.base <- strptime(filename.input_nc, "%Y%m%d%H_d01.nc.subset", tz = "GMT")


nc.bmd <- nc_open(path.downloaded_nc)

nc.ln <- ncvar_get(nc.bmd, 'XLONG')[,1,1]
nc.lt <- ncvar_get(nc.bmd, 'XLAT')[1,,1]
nc.tm <- ncvar_get(nc.bmd, 'XTIME')

nc.ln.index <- sapply(
  nc.ln[nc.ln > (constants$bbox.bgd$ln.min - constants$degree.padding) & nc.ln < (constants$bbox.bgd$ln.max + constants$degree.padding)],
  function(x) which(x == nc.ln)
)
nc.lt.index <- sapply(
  nc.lt[nc.lt > (constants$bbox.bgd$lt.min - constants$degree.padding) & nc.lt < (constants$bbox.bgd$lt.max + constants$degree.padding)],
  function(x) which(x == nc.lt)
)

nc.ln <- nc.ln[nc.ln.index]
nc.lt <- nc.lt[nc.lt.index]
nc.tm <- sapply(
  nc.tm,
  function(x) gsub(" \\+06", "", as.character(format(
    as.POSIXct(time.base + x * 60),
    "%Y%m%d%H",
    tz = "Asia/Dhaka",
    usetz = TRUE
  )))
)

nc.t2m <- ncvar_get(nc.bmd, "t2m")[nc.ln.index, nc.lt.index,]
nc.prec <- ncvar_get(nc.bmd, "prec")[nc.ln.index, nc.lt.index,]
nc.rh2m <- ncvar_get(nc.bmd, "rh2m")[nc.ln.index, nc.lt.index,]

nc_close(nc.bmd)


df <- data.frame(lon = rep(nc.ln, length(nc.lt)), lat = rep(nc.lt, each = length(nc.ln)))

for(t in seq_along(nc.tm)) df[paste("t2m", nc.tm[t], sep = "_")] <- round(as.numeric(nc.t2m[,,t]), digits = 2); rm(t)
for(t in seq_along(nc.tm)) df[paste("prec", nc.tm[t], sep = "_")] <- round(as.numeric(nc.prec[,,t]), digits = 2); rm(t)
for(t in seq_along(nc.tm)) df[paste("rh2m", nc.tm[t], sep = "_")] <- round(as.numeric(nc.rh2m[,,t]), digits = 2); rm(t)

write.csv(df, path.output_csv, row.names = FALSE)



toJSON(list(
  pathWBReadyCSV = path.output_csv
), auto_unbox = TRUE)
