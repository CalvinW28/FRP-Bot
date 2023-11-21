const mysql = require('mysql');

const db = mysql.createConnection({
    host: "omega.optiklink.com",
    user: "u116405_NdQqsm9dBi",
    password: ".viDDfTQVNMG!c2=Vv246dOy",
    database: "s116405_FRP"
});

const runQuery = (conn, sql) => {
    return new Promise((resolve, reject) => {
        conn.query(sql, function (error, result, fields) {
            if (error) {
                return reject(error)
            } else {
                return resolve(result)
            }
        })
    })
}

module.exports = { db, runQuery };
