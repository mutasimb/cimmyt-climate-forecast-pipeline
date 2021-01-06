needs(jsonlite)
needs(ncdf4)
attach(input[[1]])

r_input_path_nc -> path.nc


ncpath2time <- function(path) {
  nc <- nc_open(path)
  
  time <- as.POSIXct(
    (ncvar_get(nc, "time")/24 - 2) * 86400,
    origin = as.Date("1/1/1"),
    tz="Asia/Dhaka"
  )
  
  nc_close(nc)
  
  return(
    gsub(" GMT", "", format(
      time,
      "%Y-%m-%dT%H:%M:%S.000Z",
      tz="GMT",
      usetz = TRUE
    ))
  )
}

list.nc <- list.files(path.nc)
list.nc <- list.nc[endsWith(list.nc, "_d01.nc") & startsWith(list.nc, "bmd_forecast_")]

df.nc_files <- data.frame(
  filename = list.nc,
  date = as.Date(strptime(list.nc, "bmd_forecast_%Y%m%d_d01.nc"))
); df.nc_files <- df.nc_files[order(df.nc_files$date, decreasing = TRUE),]; rownames(df.nc_files) <- NULL


toJSON(
  lapply(
    if(nrow(df.nc_files) > 10) as.character(df.nc_files$filename)[1:10] else as.character(df.nc_files$filename),
    function (x) list(
      filename = x,
      time = ncpath2time(paste(path.nc, x, sep="/"))
    )
  ), auto_unbox = TRUE
)
