import midi
import json
from datascience import *
from jwp.jwcsv import *
import numpy as np

pattern = midi.read_midifile('twoloop.mid')

BPM = 88  # tempo of song
RES = pattern.resolution  # resolution of ticks
USPB = 60 * 1000000 / BPM  # microseconds per beat
FR = 60


def tick_to_time(tick):
    '''Returns length of event in us'''
    return tick * USPB / RES


def quantize_to_FR(us):
    mspf = 1 / FR * 1000  # miliseconds per frame
    # convert us to ms, round to nearest frame time
    return (us / 1000) // mspf * mspf


class Bunch(object):

    def __init__(self, **kw):
        self.__dict__.update(kw)

    def __repr__(self):
        return str(self.__dict__)

honey_bunches = []
master_tick = 0

for event in pattern[0]:
    if type(event) is midi.events.NoteOffEvent or type(event) is midi.events.NoteOnEvent:
        on = True
        if type(event) is midi.events.NoteOffEvent:
            on = False
        master_tick += event.tick
        tick = master_tick
        us = tick_to_time(tick)
        note, vel = event.data
        quantized_ms = quantize_to_FR(us)
        honey_bunches.append(Bunch(tick=tick, us=us, quantized_ms=quantized_ms, on=on, note=note, vel=vel))
    else:
        print(type(event))
        print(event.__dict__)


out = [b.__dict__ for b in honey_bunches]
dkeys = [key for key in honey_bunches[0].__dict__.keys()]
print(dkeys)


write_csv('miditest.csv', out, dict_headers=dkeys)

'''Load amplitude for reference'''

with open('json/amplitude/keys_01_60hz.json', 'r') as f:
    key_amp = json.load(f)
rows = []
for d in key_amp:
    time = d['time']
    volume = d['volume']
    rows.append([time, volume])

key_frames = Table(['time', 'amplitude']).with_rows(rows)
key_frames.sort('amplitude', descending=True)

'''Load MIDI'''

midi = Table().read_table('miditest.csv')
max_time = np.max([float(t) for t in key_frames.column('time')])
midi_clean = midi.select(['note', 'vel', 'on', 'quantized_ms'])
temp = midi_clean
for t in np.arange(0, 358316.7, 50 / 3):
    tstr = "{0:.4f}.format(t)"
    if tstr not in midi_clean.column('quantized_ms'):
        temp = temp.with_row([-1, -1, False, tstr])
midi_clean = temp


def make_events(table):
    events = []
    table = table.with_column('floatTime', table.column('quantized_ms').astype(float))
    table.sort('floatTime')
    for row in np.arange(0, table.num_rows, 2):
        temp = {}
        temp['startTime'] = float(table.rows[row].item('floatTime'))
        temp['endTime'] = float(table.rows[row + 1].item('floatTime'))
        temp['velocity'] = float(table.rows[row].item('vel'))
        events.append(temp)
    print(events)
    return events


played = set(midi_clean.where('note', are.above_or_equal_to(0)).column('note'))
notes = []
# {key: note, notes: {timeStart, timeEnd, volume}}
for key in played:
    note = {}
    note['key'] = int(key)
    note['notes'] = make_events(midi_clean.where('note', key))
    notes.append(note)

with open('notesample.json', 'w') as f:
    json.dump(notes, f)
