const query = require("samp-query");

const options = {
  host: "162.19.133.164",
  port: 5508
}

const stats = () => {
  return new Promise((resolve, reject) => {
    query(options, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

module.exports = { stats };
