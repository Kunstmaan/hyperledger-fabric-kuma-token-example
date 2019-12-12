#!/usr/bin/env python2

import json
import argparse

parser = argparse.ArgumentParser(description='Merges packages.json dependencies, putting the second deps in the first package.json')
parser.add_argument('firstPackageJson', type=str,
                    help='The first package.json')
parser.add_argument('secondPackageJson', type=str,
                    help='The second package.json')

args = parser.parse_args()

with open(args.firstPackageJson, 'r') as fpj:
    p1 = json.load(fpj)

with open(args.secondPackageJson, 'r') as fpj:
    p2 = json.load(fpj)

for k,v in p2['dependencies'].items():
    p1['dependencies'][k] = v

with open(args.firstPackageJson, 'w') as fpj:
    json.dump(p1, fpj, indent=4)
