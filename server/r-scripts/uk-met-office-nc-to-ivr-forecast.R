needs(ncdf4)
needs(pracma)
needs(jsonlite)
attach(input[[1]])


r_input_path_nc_file -> path.downloaded_nc
r_input_path_mungbean -> path.mungbean_dir


rain2case <- function(rain) return(if(
  rain < 5
) 1 else if(
  rain >= 5 & rain < 23
) 2 else if(
  rain >= 23 & rain <= 38
) 3 else if(
  rain > 38
) 4 else as.numeric(NA))


df.forecast_points <- read.csv(paste(path.mungbean_dir, "210215_forecast_points_ivr.csv", sep = "/"))


nc.uk_met_office <- nc_open(path.downloaded_nc)

nc.ln <- ncvar_get(nc.uk_met_office, 'lon')
nc.lt <- ncvar_get(nc.uk_met_office, 'lat')
nc.tm <- format(
  as.POSIXct(
    (ncvar_get(nc.uk_met_office, 'time') - 48) * 3600,
    origin = "1-1-1 00:00"
  ),
  "%Y%m%d%H"
)

nc.prec <- ncvar_get(nc.uk_met_office, "prec")

nc_close(nc.uk_met_office); rm(nc.uk_met_office)


d1 <- as.Date(strptime(nc.tm[1], "%Y%m%d%H"))
dates <- seq.Date(d1, by = "1 day", length.out = 5)
list.array <- list(); for(t in 1:(length(nc.tm) - 1)) {
  i.string <- format(as.Date(strptime(nc.tm[t], "%Y%m%d%H")), "d%Y%m%d")
  print(c(i.string, t))
  list.array[[i.string]] <- if( is.null(list.array[[i.string]]) ) nc.prec[,, t+1] else list.array[[i.string]] + nc.prec[,, t+1]
}; rm(t, i.string)

nc.prec_daily <- rep(NA, length(nc.ln) * length(nc.lt) * 5); dim(nc.prec_daily) <- c(length(nc.ln), length(nc.lt), 5)
for(i in 1:length(list.array)) nc.prec_daily[,, i] <- list.array[[names(list.array)[i]]]; rm(i, list.array)

df.5_day_forecast <- as.data.frame(round(sapply(
  letters[1:nrow(df.forecast_points)],
  function(l) sapply(
    seq_along(dates),
    function(d) interp2(
      nc.ln,
      nc.lt,
      t(nc.prec_daily[,, d]),
      df.forecast_points$lon[df.forecast_points$id == paste0("l", l)],
      df.forecast_points$lat[df.forecast_points$id == paste0("l", l)],
      method = "linear"
    )
  )
))); colnames(df.5_day_forecast) <- paste0("l", colnames(df.5_day_forecast)); rm(nc.prec_daily, nc.prec)

list.5_day_forecast <- as.list(df.5_day_forecast)
list.data <- lapply(
  names(list.5_day_forecast),
  function (l) {
    l.forecast <- list(); for(d in seq_along(dates)) l.forecast[[d]] <- list(
      date = as.numeric(format(dates, "%Y%m%d"))[d],
      rainfall = list.5_day_forecast[[l]][d],
      code = rain2case(list.5_day_forecast[[l]][d])
    ); rm(d)
    return(list(
      id = l,
      dis = df.forecast_points$dis[df.forecast_points$id == l],
      upz = df.forecast_points$upz[df.forecast_points$id == l],
      unn = df.forecast_points$unn[df.forecast_points$id == l],
      group = df.forecast_points$group[df.forecast_points$id == l],
      longitude = df.forecast_points$lon[df.forecast_points$id == l],
      latitude = df.forecast_points$lat[df.forecast_points$id == l],
      forecast = l.forecast
    ))
  }
)


toJSON(list.data, auto_unbox = TRUE)
