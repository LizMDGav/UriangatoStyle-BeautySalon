const pgp = require("pg-promise")();

const db = pgp({
    user: 'root',
    host: '127.0.0.1',
    database: 'uriangato_style',
    password: 'root',
    port: '5432',
    ssl: 'false'
});

module.exports = db;
