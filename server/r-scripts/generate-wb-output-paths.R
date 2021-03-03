needs(jsonlite)
attach(input[[1]])

r_input_path_nc_file -> path.downloaded_nc
r_input_path_download_dir -> path.download_dir
r_input_path_local_wb -> path.wb_dir_local
r_input_path_remote_wb -> path.wb_dir_remote


filename.input_nc <- gsub(paste0(path.download_dir, '/'), '', path.downloaded_nc)
time.base <- strptime(filename.input_nc, "%Y%m%d%H_d01.nc.subset", tz = "GMT")
filename.output_csv <- gsub(" \\+06", "", as.character(format(
  as.POSIXct(time.base),
  "bmd_forecast_%Y%m%d_d01.csv",
  tz = "Asia/Dhaka",
  usetz = TRUE
)))



toJSON(list(
  local = paste(path.wb_dir_local, filename.output_csv, sep = "/"),
  remote = paste(path.wb_dir_remote, "d01-outputs", filename.output_csv, sep = "/")
), auto_unbox = TRUE)
