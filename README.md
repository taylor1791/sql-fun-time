SQL Fun Time!
=============

> What time is it? SQL Time!

## Setup
```
npm install # or yarn install
```

## Usage

You can run an individual sql script with `./index.js sql/select1.sql`. You
can even pass parameters to the script using the `--params` option. The
argument must be a valid JSON array. For example, `--params '[1,2,3]'`.

Additionally you can use the script in watch mode. By using `./index.js --watch`
the script will monitor the `sql` directory for changes and run the sql script.

