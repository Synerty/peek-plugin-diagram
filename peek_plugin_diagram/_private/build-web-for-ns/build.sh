#!/bin/bash

set errexit
set nounset

ng build -prod --no-aot

[ -d dist ]

rm ../web-dist/*
mv dist/* ../web-dist/