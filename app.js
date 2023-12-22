// express
const express = require('express');
const app = express();
const mysql = require('mysql2');
const fetch = require('node-fetch');
const fs = require('fs');
const port = 4000;
const tookorUrl = "https://toonkor";

// mysql 연결
try {
  const database = fs.readFileSync('./config.json');
  _config = JSON.parse(database);
}
catch {
  console.log("config.json 파일을 찾을 수 없습니다.");
  process.exit();
}

const connection = mysql.createConnection({
  host: _config.host,
  user: _config.user,
  password: _config.password,
  database: _config.database
});

(async() => {
  // MySQL 연결 테스트
  connection.connect((err) => {
    if (err) {
      console.error('MySQL connection error:', err);
    } else {
      console.log('Connected to MySQL database');
    }
  });

  app.get('/', async (req, res) => {
    const ret = {};
    try{
      let siteNumber = await processSiteNumber();
      let siteFullUrl = tookorUrl + siteNumber + ".com";
      ret.siteFullUrl = siteFullUrl;
      ret.siteNumber = siteNumber;
    }
    catch(e) {
      console.log(e);
      ret.error = e;
    }
    res.send(ret);
    
  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
})();




async function tryToonkorSite(siteNumber) {

  const siteFullUrl = tookorUrl + siteNumber + ".com";
  try {
    const response = await fetch(siteFullUrl, { redirect: 'manual' });
    const text = await response.text();
    connection.query(`UPDATE Toonkor_config SET meta_value = ? WHERE meta_key = 'site_number'`,
    [siteNumber],
    (error, results, fields) => {
      if (error) {
        console.error('MySQL query error:', error);
      }
      else {
        console.log(results);
      }
    });
    return true;
  }
  catch (error) {
    return false;
  }
  
}


async function getSiteNumber() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT meta_value FROM Toonkor_config WHERE meta_key = 'site_number'", (error, results, fields) => {
      if (error) {
        console.error('MySQL query error:', error);
        reject(error);
      }
      else {
        resolve(parseInt(results[0].meta_value, 10));
      }
    });
  
  })
}

async function processSiteNumber() {
  let siteNumber = await getSiteNumber();
  while (await tryToonkorSite(siteNumber) === false) {
    siteNumber = siteNumber + 1;
  }
  return siteNumber;
} 