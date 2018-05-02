#!/bin/bash

set errexit
set nounset

rm -rf src/@peek/peek_plugin_diagram
cp -pr ../../plugin-module src/@peek/peek_plugin_diagram

rm -rf src/assets/peek_plugin_diagram
cp -pr ../ns-assets/assets/peek_plugin_diagram src/assets/

find -d src/peek_plugin_diagram -depth 1  -type d -exec rm -rf {} \;
for name in cache canvas canvas-component layer-component tuples
do
    cp -pr ../both-app/${name} src/peek_plugin_diagram/
done

cp -pr ../both-app/DiagramUtil.ts src/peek_plugin_diagram/DiagramUtil.ts

ng build -prod --no-aot

[ -d dist ]


ASSET_DIR="../ns-assets/www"
INDEX="${ASSET_DIR}/index.html"

rm -rf ${ASSET_DIR}/*
mv dist/* ${ASSET_DIR}/

#sed -i 's,src=",src="./,g' $INDEX
#sed -i 's,href=",href="./,g' $INDEX


#TARGET='~/assets/peek_plugin_diagram/www/'
#TARGET='/peek_plugin_diagram/web_dist/'

#sed -i 's,src=",src="/peek_plugin_diagram/web_dist/,g' $INDEX
#sed -i 's,href=",href="/peek_plugin_diagram/web_dist/,g' $INDEX

sed -i 's,src=",src="./,g' $INDEX
sed -i 's,href=",href="./,g' $INDEX
