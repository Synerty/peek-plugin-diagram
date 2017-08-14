#!/bin/bash

set errexit
set nounset

ng build -prod --no-aot

[ -d dist ]

rm ../dist-web/*
mv dist/* ../dist-web/

sed -i 's,src=",src="/peek_plugin_diagram/web_dist/,g' ../dist-web/index.html
sed -i 's,href=",href="/peek_plugin_diagram/web_dist/,g' ../dist-web/index.html

