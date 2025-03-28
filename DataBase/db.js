const pgp = require("pg-promise")();

const db = pgp({
    user: 'postgres',
    host: 'localhost',
    database: 'uriangato_style',
    password: 'root',
    port: '5432',
});

module.exports = db;
