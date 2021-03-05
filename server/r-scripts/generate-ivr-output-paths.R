needs(jsonlite)
attach(input[[1]])

r_input_path_nc_file -> path.downloaded_nc
r_input_path_local_mungbean -> path.mungbean_dir_local


filename.input_nc <- rev(strsplit(path.downloaded_nc, '/')[[1]])[1]
time.base <- strptime(filename.input_nc, "%Y%m%d%H_d01.nc.subset", tz = "GMT")
filename.output_provider <- gsub(" \\+06", "", as.character(format(
  as.POSIXct(time.base),
  "bmd_forecast_ivr_%Y%m%d_d01.json",
  tz = "Asia/Dhaka",
  usetz = TRUE
)))
filename.output_developer_json <- gsub(
  "bmd_forecast_ivr_",
  "bmd_forecast_ivr_developer_",
  filename.output_provider
)



toJSON(list(
  localOutputProvider = paste(path.mungbean_dir_local, filename.output_provider, sep = "/"),
  localOutputDeveloper = paste(path.mungbean_dir_local, filename.output_developer_json, sep = "/")
), auto_unbox = TRUE)
