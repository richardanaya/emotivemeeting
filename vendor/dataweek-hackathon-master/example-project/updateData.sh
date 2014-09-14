#!/bin/sh
rm -rf data/*.csv
node exportCSV.js
ruby upload.rb
