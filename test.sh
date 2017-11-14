set -e

./index.js sql/select1.sql > /dev/null
./index.js sql/select_param.sql --params '["Hello World"]' > /dev/null
./index.js sql/select_media_types.sql > /dev/null
