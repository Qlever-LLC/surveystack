#!/bin/bash

echo "exporting $1"

mkdir img

inkscape -C -y 0 -o img/hero.png -w 1024 $1

