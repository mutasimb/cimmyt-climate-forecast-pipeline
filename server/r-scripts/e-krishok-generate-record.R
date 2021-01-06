needs(jsonlite)
attach(input[[1]])


r_input_forecast -> json.forecast
r_input_area_names -> json.area_names
r_input_path_mungbean -> path.mungbean_files_dir


list.forecast <- fromJSON(json.forecast)
df.area_names <- fromJSON(json.area_names)

filename.input_nc_file <- list.forecast$filename
path.output_record_csv <- paste0(
  path.mungbean_files_dir, "/mungbean_",
  gsub("_d01.nc", "", filename.input_nc_file), ".csv"
)

df.5_day_forecast <- as.data.frame(list.forecast$forecast_prec)
df.5_day_cases <- as.data.frame(list.forecast$forecast_case)
df.5_day_forecast.tmx <- as.data.frame(list.forecast$forecast_tmx)
df.5_day_forecast.tmn <- as.data.frame(list.forecast$forecast_tmn)

if(exists("df.mungbean_forecast")) rm(df.mungbean_forecast); for (i in df.area_names$code) {
  i.df.prec <- data.frame(location = i, date = df.5_day_forecast$date, prec = df.5_day_forecast[[i]])
  i.df.case <- data.frame(location = i, date = df.5_day_cases$date, case = df.5_day_cases[[i]])
  i.df.tmx <- data.frame(location = i, date = df.5_day_forecast.tmx$date, tmx = df.5_day_forecast.tmx[[i]])
  i.df.tmn <- data.frame(location = i, date = df.5_day_forecast.tmn$date, tmn = df.5_day_forecast.tmn[[i]])
  i.df <- merge(
    i.df.prec, i.df.case, by = c("location", "date"), all = TRUE
  ); i.df <- merge(
    i.df, i.df.tmx, by = c("location", "date"), all = TRUE
  ); i.df <- merge(
    i.df, i.df.tmn, by = c("location", "date"), all = TRUE
  )
  df.mungbean_forecast <- if(!exists("df.mungbean_forecast")) i.df else rbind(df.mungbean_forecast, i.df)
}; rm(i.df.prec, i.df.case, i.df.tmx, i.df.tmn, i.df)

df.mungbean_forecast <- merge(df.area_names, df.mungbean_forecast, by.x = "code", by.y = "location", all.y = TRUE)
df.mungbean_forecast <- df.mungbean_forecast[colnames(df.mungbean_forecast)[-c(1, 7)]]
df.mungbean_forecast <- df.mungbean_forecast[order(
  df.mungbean_forecast$dis,
  df.mungbean_forecast$upz,
  df.mungbean_forecast$union,
  df.mungbean_forecast$date
),]; rownames(df.mungbean_forecast) <- NULL

write.csv(
  df.mungbean_forecast,
  path.output_record_csv,
  row.names = FALSE
)


toJSON(list(
  pathLog = path.output_record_csv,
  dataLog = df.mungbean_forecast
))
