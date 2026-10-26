#!/bin/bash
cd "$(dirname "$0")"
run() { node ana.js $1 50 $2 ez/$2_$1.json >> ez/log.txt 2>&1; }
( run 401 norms; run 2121 none ) &
( run 606 norms; run 2222 none ) &
( run 1515 norms; run 2323 none ) &
( run 1616 norms; run 2424 none ) &
wait
echo ALLDONE2 >> ez/log.txt
