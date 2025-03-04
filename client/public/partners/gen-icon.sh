#!/bin/bash

echo "exporting $1"

mkdir -p images/icons
mkdir img

inkscape -C -y 0 -o images/icons/icon-72x72.png -w 72 -h 72  $1
inkscape -C -y 0 -o images/icons/icon-96x96.png -w 96 -h 96  $1
inkscape -C -y 0 -o images/icons/icon-128x128.png -w 128 -h 128  $1
inkscape -C -y 0 -o images/icons/icon-144x144.png -w 144 -h 144  $1
inkscape -C -y 0 -o images/icons/icon-152x152.png -w 152 -h 152  $1
inkscape -C -y 0 -o images/icons/icon-192x192.png -w 192 -h 192  $1
inkscape -C -y 0 -o images/icons/icon-384x384.png -w 384 -h 384  $1
inkscape -C -y 0 -o images/icons/icon-512x512.png -w 512 -h 512  $1
inkscape -C -y 0 -o img/logo.png -w 1024 -h 1024 $1

