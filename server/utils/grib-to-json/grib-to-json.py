import sys
import json
import xarray as xr
import numpy as np


path_grib_dir = sys.argv[1]
filename_grib = sys.argv[2]
path_json_dir = sys.argv[3]
filename_json = sys.argv[4]

path_grib = path_grib_dir + '/' + filename_grib
path_json = path_json_dir + '/' + filename_json


def climate_var(filename):
    if "relative-humidity" in filename:
        return "r2"
    elif "temperature" in filename:
        return "t2m"
    else:
        return "tp"


def read_grib(path):
    return xr.open_dataset(path, engine='cfgrib')


def datetime_as_string(x):
    return np.datetime_as_string(x.astype('datetime64[ms]'), timezone='UTC')


def extract_data_from_grib(ds_grib, filename):
    grib_dict = {
        "source": filename,
        "lon": list(ds_grib.get("longitude").values),
        "lat": list(ds_grib.get("latitude").values),
        "time": list(map(
            datetime_as_string,
            list(ds_grib.get("valid_time").values.ravel())
        )),
        "data": ds_grib.get(climate_var(filename)).values.tolist()
    }
    return grib_dict


def write_json(dict, path):
    with open(path, "w") as outfile:
        json.dump(dict, outfile)


def main():
    ds = read_grib(path_grib)
    dict_grib = extract_data_from_grib(ds, filename_grib)
    write_json(dict_grib, path_json)
    print("Python script successfully run")


if __name__ == '__main__':
    main()
