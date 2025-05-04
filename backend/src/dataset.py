# read from dataset.jsonl

import json

with open('dataset.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        print(data)


