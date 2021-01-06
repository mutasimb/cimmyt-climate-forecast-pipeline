needs(ncdf4)
needs(jsonlite)
attach(input[[1]])


r_input_path_download_dir -> path.download
r_input_path_input_file_nc -> path.input_file_nc


filename.input_file_nc <- rev(
  strsplit(path.input_file_nc, '/')[[1]]
)[1]

path.output_file_csv <- paste0(
  path.download, "/",
  gsub(".nc", "", filename.input_file_nc), ".csv"
)


nc <- nc_open(path.input_file_nc)

lon <- ncvar_get(nc, "lon")
lat <- ncvar_get(nc, "lat")
time <- as.numeric(format(as.POSIXct(
  (ncvar_get(nc, "time") / 24 - 2) * 86400,
  origin = as.Date("1/1/1")
), "%Y%m%d%H"))

t2m <- ncvar_get(nc, "t2m")
prec <- ncvar_get(nc, "prec")
rh2m <- ncvar_get(nc, "rh2m")

nc_close(nc); rm(nc)


df <- data.frame(lon = rep(lon, length(lat)), lat = rep(lat, each = length(lon)))

for(t in seq_along(time)) df[paste("t2m", time[t], sep = "_")] <- round(as.numeric(t2m[,,t]), digits = 2); rm(t)
for(t in seq_along(time)) df[paste("prec", time[t], sep = "_")] <- round(as.numeric(prec[,,t]), digits = 2); rm(t)
for(t in seq_along(time)) df[paste("rh2m", time[t], sep = "_")] <- round(as.numeric(rh2m[,,t]), digits = 2); rm(t)

write.csv(df, path.output_file_csv, row.names = FALSE)


toJSON(list(
  pathOutputCSV = path.output_file_csv
), auto_unbox = TRUE)
