needs(ncdf4)
needs(pracma)
needs(jsonlite)
attach(input[[1]])


r_input_path_nc_file -> path.downloaded_nc
r_input_path_download_dir -> path.download_dir
r_input_path_mungbean -> path.mungbean_dir



rain2case <- function(rain) {
  if(rain < 5) { 
    return(1)
  } else if(rain >= 5 & rain < 23) {
    return(2)
  } else if(rain >= 23 & rain <= 38) {
    return(3)
  } else if(rain > 38) {
    return(4)
  }
}

filename.input_nc <- gsub(paste0(path.download_dir, '/'), '', path.downloaded_nc)
time.base <- strptime(filename.input_nc, "%Y%m%d%H_d01.nc.subset", tz = "GMT")


nc.bmd <- nc_open(path.downloaded_nc)

nc.ln <- ncvar_get(nc.bmd, 'XLONG')[,1,1]
nc.lt <- ncvar_get(nc.bmd, 'XLAT')[1,,1]
nc.tm <- sapply(
  ncvar_get(nc.bmd, 'XTIME'),
  function(x) gsub(" \\+06", "", as.character(format(
    as.POSIXct(time.base + x * 60),
    "%Y%m%d%H",
    tz = "Asia/Dhaka",
    usetz = TRUE
  )))
)

nc.prec <- ncvar_get(nc.bmd, "prec")
nc.t2m <- ncvar_get(nc.bmd, "t2m")

nc_close(nc.bmd)


d0 <- as.Date(strptime(nc.tm[1], "%Y%m%d%H"))
dates <- seq.Date(d0, by = "1 day", length.out = 5)
list.array <- list(); for(t in 1:(length(nc.tm) - 1)) {
  i.string <- format(as.Date(strptime(nc.tm[t], "%Y%m%d%H")), "d%Y%m%d")
  list.array[[i.string]] <- if( is.null(list.array[[i.string]]) ) nc.prec[,, t+1] else list.array[[i.string]] + nc.prec[,, t+1]
}; rm(t, i.string)

nc.prec_daily <- rep(NA, length(nc.ln) * length(nc.lt) * 5); dim(nc.prec_daily) <- c(length(nc.ln), length(nc.lt), 5)
for(i in 1:length(list.array)) nc.prec_daily[,, i] <- list.array[[names(list.array)[i]]]; rm(i, list.array)

df.forecast_points <- read.csv(paste(path.mungbean_dir, "200000_forecast_points_ekrishok.csv", sep = "/"))

df.5_day_forecast <- data.frame(date = dates, as.data.frame(round(sapply(
  letters[1:nrow(df.forecast_points)],
  function(l) sapply(
    seq_along(dates),
    function(d) interp2(
      nc.ln,
      nc.lt,
      t(nc.prec_daily[,, d]),
      df.forecast_points$lon[which(l == letters)],
      df.forecast_points$lat[which(l == letters)],
      method = "linear"
    )
  )
)))); colnames(df.5_day_forecast)[-1] <- paste0("l", colnames(df.5_day_forecast)[-1]); rm(nc.prec_daily, nc.prec)

df.5_day_forecast.t2m <- data.frame(time = nc.tm, as.data.frame(sapply(
  letters[1:nrow(df.forecast_points)],
  function(l) sapply(seq_along(nc.tm), function(x) interp2(
    nc.ln,
    nc.lt,
    t(nc.t2m[,, x]),
    df.forecast_points$lon[which(l == letters)],
    df.forecast_points$lat[which(l == letters)],
    method = "linear"
  ))
))); rm(nc.t2m)

spline.xout <- seq.POSIXt(
  as.POSIXct(strptime(df.5_day_forecast.t2m$time[1], "%Y%m%d%H")),
  as.POSIXct(strptime(df.5_day_forecast.t2m$time[nrow(df.5_day_forecast.t2m)], "%Y%m%d%H")),
  by = "min"
); spline.xout <- spline.xout[-length(spline.xout)]
df.5_day_forecast.t2m_splined <- data.frame(
  date = as.numeric(format(spline.xout, "%Y%m%d")),
  as.data.frame(sapply(
    letters[1:nrow(df.forecast_points)],
    function(l) spline(
      as.POSIXct(strptime(df.5_day_forecast.t2m$time, "%Y%m%d%H")),
      df.5_day_forecast.t2m[[l]],
      xout = spline.xout,
      method = "natural"
    )$y
  ))
); rm(spline.xout)

df.5_day_forecast.tmn <- data.frame(
  date = unique(df.5_day_forecast.t2m_splined$date),
  as.data.frame(round(sapply(
    letters[1:nrow(df.forecast_points)],
    function(l) sapply(
      unique(df.5_day_forecast.t2m_splined$date),
      function(d) min(df.5_day_forecast.t2m_splined[[l]][d == df.5_day_forecast.t2m_splined$date])
    )
  ) * 10) / 10)
); colnames(df.5_day_forecast.tmn)[-1] <- paste0("l", colnames(df.5_day_forecast.tmn)[-1])
df.5_day_forecast.tmx <- data.frame(
  date = unique(df.5_day_forecast.t2m_splined$date),
  as.data.frame(round(sapply(
    letters[1:nrow(df.forecast_points)],
    function(l) sapply(
      unique(df.5_day_forecast.t2m_splined$date),
      function(d) max(df.5_day_forecast.t2m_splined[[l]][d == df.5_day_forecast.t2m_splined$date])
    )
  ) * 10) / 10)
); colnames(df.5_day_forecast.tmx)[-1] <- paste0("l", colnames(df.5_day_forecast.tmx)[-1])
rm(df.5_day_forecast.t2m, df.5_day_forecast.t2m_splined)

df.5_day_forecast$date <- as.numeric(format(df.5_day_forecast$date, "%Y%m%d"))
df.5_day_cases <- df.5_day_forecast
for(i in 2:ncol(df.5_day_forecast)) df.5_day_cases[[i]] <- sapply(df.5_day_forecast[[i]], function(x) rain2case(x))


toJSON(list(
  filename = filename.input_nc,
  forecast_prec = as.list(df.5_day_forecast),
  forecast_tmn = as.list(df.5_day_forecast.tmn),
  forecast_tmx = as.list(df.5_day_forecast.tmx),
  forecast_case = as.list(df.5_day_cases)
), auto_unbox = TRUE, pretty = TRUE)
