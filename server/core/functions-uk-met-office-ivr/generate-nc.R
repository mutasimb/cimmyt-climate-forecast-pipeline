needs(ncdf4)
needs(jsonlite)

attach(input[[1]])


r_input_date_str -> str.date
r_input_paths_json -> paths.json
r_input_path_netcdf -> path.nc



params <- c(
  "precipitation-accumulation-1h",
  "precipitation-accumulation-3h"
)
timesteps.nc <- seq(
  as.POSIXct(strptime(str.date, "%Y%m%d") + 24 * 3600),
  by = "1 hour",
  length = 5 * 24 + 1
)



list.df.forecast <- lapply(paths.json, function(x) {
  x.json <- read_json(x)

  x.param <- params[sapply(params, function(param) grepl(param, x.json$source, fixed = TRUE), USE.NAMES = FALSE)]
  
  x.timesteps_json <- gsub(" \\+06", "", format(
    as.POSIXct(strptime(
      sapply(x.json$time, function(time) time),
      "%Y-%m-%dT%H:%M:%S.000Z",
      tz = "GMT"
    )),
    "%Y%m%d%H",
    usetz = TRUE,
    tz = "Asia/Dhaka"
  )); x.timesteps_json.posixct <- as.POSIXct(strptime(x.timesteps_json, "%Y%m%d%H"))
  x.lon <- sapply(x.json$lon, function(lon) lon)
  x.lat <- sapply(x.json$lat, function(lat) lat)
  x.df.coords <- data.frame(
    x = rep(seq_along(x.lon), length(x.lat)),
    y = rep(seq_along(x.lat), each = length(x.lon)),
    lon = rep(x.lon, length(x.lat)),
    lat = rep(x.lat, each = length(x.lon))
  )

  if(x.param == "precipitation-accumulation-1h") {
    x_sub.timesteps_json.posixct <- x.timesteps_json.posixct[!(x.timesteps_json.posixct < timesteps.nc[1])][-1]

    xi_sub.timesteps_json <- sapply(
      format(x_sub.timesteps_json.posixct, "%Y%m%d%H"),
      function(t) which(t == format(x.timesteps_json.posixct, "%Y%m%d%H")),
      USE.NAMES = FALSE
    )

    x.data <- data.frame(
      t = x.timesteps_json.posixct,
      as.data.frame(apply(
        x.df.coords, 1, function(row) sapply(x.json$data, function(t) t[[ row[["y"]] ]][[ row[["x"]] ]])
      ))
    ); x.data <- x.data[xi_sub.timesteps_json,]; rownames(x.data) <- NULL
  } else if(x.param == "precipitation-accumulation-3h") {
    x.data <- data.frame(
      t = x.timesteps_json.posixct,
      as.data.frame(apply(
        x.df.coords, 1, function(row) sapply(x.json$data, function(t) t[[ row[["y"]] ]][[ row[["x"]] ]])
      ))
    )

    x.timesteps_json.posixct.hourly <- c(); for(t in seq_along(x.timesteps_json.posixct)) x.timesteps_json.posixct.hourly <- c(
      x.timesteps_json.posixct.hourly,
      x.timesteps_json.posixct[t] - 2 * 3600,
      x.timesteps_json.posixct[t] - 1 * 3600,
      x.timesteps_json.posixct[t] - 0 * 3600
    ); rm(t)


    x.data <- data.frame(
      t = as.POSIXct(x.timesteps_json.posixct.hourly, origin = '1970-01-01'),
      as.data.frame(sapply(
        colnames(x.data)[-1],
        function(col) rep(x.data[[col]]/3, each = 3)
      ))
    )
  }

  return(list(
    param = x.param,
    xy.grid = x.df.coords[c("lon", "lat")],
    df = x.data
  ))
})


xy.grid <- list.df.forecast[[1]]$xy.grid
df.climate_vars <- data.frame(
  v = c("prec"),
  d = c("Total Rainfall"),
  u = c("mm"),
  p = c("float")
)


list.nc_dimensions <- list(
  ncdim_def("lon", "degrees_east", unique(xy.grid$lon)),
  ncdim_def("lat", "degrees_north", unique(xy.grid$lat)),
  ncdim_def(
    "time",
    "hours since 1-1-1 00:00:00",
    sapply(
      timesteps.nc[1:121],
      function(x) as.numeric(x - ISOdatetime(1, 1, 1, 0, 0, 0, tz = "GMT")) * 24 + 48
    )
  )
)


list.ncvar_get <- list(); list.ncvar_def <- list(); for (v in 1:nrow(df.climate_vars)) {
  v.df <- if(df.climate_vars$v[v] == "prec") rbind(
    cbind(
      data.frame(t = timesteps.nc[1]),
      as.data.frame(t(sapply(
        colnames(list.df.forecast[[1]]$df)[-1], function(col) 0, USE.NAMES = TRUE
      )))
    ),
    list.df.forecast[[1]]$df,
    list.df.forecast[[2]]$df
  ) else NULL
  
  v.array <- c(); for(vr in 1:nrow(v.df)) v.array <- c(v.array, as.numeric(v.df[vr, -1])); rm(vr)
  dim(v.array) <- sapply(list.nc_dimensions, "[[", "len")
  list.ncvar_get[[length(list.ncvar_get) + 1]] <- v.array
  
  list.ncvar_def[[length(list.ncvar_def) + 1]] <- ncvar_def(
    df.climate_vars$v[v],
    as.character(df.climate_vars$u)[v],
    list.nc_dimensions,
    NULL,
    as.character(df.climate_vars$d)[v],
    as.character(df.climate_vars$p)[v]
  )
}; rm(v, v.df, v.array)


nc <- nc_create(
  path.nc,
  list.ncvar_def,
  force_v4 = TRUE
); for(i in seq_along(list.ncvar_get)) ncvar_put(nc, list.ncvar_def[[i]], list.ncvar_get[[i]]); rm(i)
nc_close(nc); rm(nc)


toJSON(list(
  message = paste(path.nc, "generated")
))
