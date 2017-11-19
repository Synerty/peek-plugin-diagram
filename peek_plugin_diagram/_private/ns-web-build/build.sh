#!/bin/bash

set errexit
set nounset

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
