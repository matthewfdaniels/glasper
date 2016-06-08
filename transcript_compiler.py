import json
from glob import glob
filenames = glob("./segments/*.json")
print(filenames)

time_block = 0
blocks = []
for fn in filenames:
    with open(fn, 'r') as t:
        data = json.loads(t.read())
        for x in data['results']:
            best_alt = x['alternatives'][0]
            trans = best_alt['transcript']
            if len(blocks) > 0:
                if len(trans.split(' ')) < 10:
                    if len(blocks[-1]['text'].split(' ')) < 10:
                        blocks[-1]['text'] += ' ' + trans.strip()
                        continue
            block = {}
            block['time'] = best_alt['timestamps'][0][1] + time_block
            block['text'] = trans.strip()
            blocks.append(block)

    time_block += 300

with open('transcript.txt', 'w') as f:
    for block in blocks:
        time = str(int(block['time'] // 60)) + "m" + str(int(block['time'] % 60)) + "s"
        f.write(time + ': ' + block['text'] + '\n')
