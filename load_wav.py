import numpy as np
import scipy.io.wavfile
import os
import json
import math

# RMS window refresh rate, ie framerate
HZ = 60
# scipy doesn't like 24-bit wavs, so I converted them to 16-bit
# and put them in their own directory
WAV_DIR = '16'
# saving as floating point numbers leads to
# unnecessarily large files, so scaling up by a constant
# (to preserve granularity) and rounding to int drastically
# cuts file sizes, eg:
# 274KB to 87KB for Rob 5_19_15_06.L, scale 100 at 60Hz
SCALE = False
SCALE_FACTOR = 100


def rms(x):
    assert x.size > 0
    # only math.fabs works because of a VERY WEIRD
    # error involving 16-bit integers...
    absolute = math.fabs(x.dot(x))
    assert absolute >= 0
    return np.sqrt(absolute / x.size)


def scale_and_round(arr):
    arr = SCALE_FACTOR * arr
    return arr.astype(int)

wavfiles = [file for file in os.listdir(WAV_DIR) if '.wav' in file]

for filename in wavfiles:
    filepath = WAV_DIR + '/' + filename
    print(filepath)
    sample_rate, nparray = scipy.io.wavfile.read(filepath)

    # how many RMS windows we'll need for the array of samples @ given
    # sample & refresh rates
    window_size = int(len(nparray) / sample_rate) * HZ
    current_sample = 0
    rms_windows = np.empty(1)
    while current_sample < len(nparray):
        last_sample = current_sample
        current_sample += sample_rate / HZ
        current_rms = rms(nparray[last_sample:current_sample])
        rms_windows = np.append(rms_windows, current_rms)
    if SCALE:
        rms_windows = scale_and_round(rms_windows)
    # convert np array to python list for json serialization
    rms_windows[0] = 0
    rms_max = np.max(rms_windows)
    rms_windows = rms_windows / rms_max
    rms_windows = rms_windows.tolist()
    objs = []
    for index in np.arange(len(rms_windows)):
        obj = {}
        obj['time'] = 1 / HZ * 1000 * index
        obj['volume'] = rms_windows[index]
        objs.append(obj)

    name = filepath.split('.wav')[0]
    namestr = name + ' ' + str(HZ) + 'Hz.json'
    namestr = namestr.replace(' 1', '')
    namestr = namestr.lower().replace(' ', '_')
    with open(namestr, 'w') as f:
        json.dump(objs, f)
