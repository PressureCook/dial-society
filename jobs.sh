#!/bin/bash
cd "$(dirname "$0")"
run() { node ana.js $1 50 none ez/none_$1.json >> ez/log.txt 2>&1; }
( run 707; run 1111 ) &
( run 808; run 1212 ) &
( run 909; run 1313 ) &
( run 1010; run 1414 ) &
wait
echo ALLDONE >> ez/log.txt
