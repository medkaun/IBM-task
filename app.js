var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var swig = require("swig");
var sqlite = require("sqlite3").verbose();

var db = new sqlite.Database("./data.db", (err) => console.log(err));

var app = express();

app.use(express.static(path.join(__dirname, "public/assets")));
app.use(bodyParser.urlencoded({extended: false}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", swig.renderFile);

var cur = [];

app.get("/", (req, res) => {
  // getting currency symbols from the database
  let sql = "SELECT Currency currency FROM rates ORDER BY Currency";
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      cur.push(row.currency);
    });
    res.render("index", {rows: cur})
  });
});

app.post("/", (req, res) => {
  let amount = req.body.amount;
  let a = req.body.from;
  let b = req.body.to;
  //checking if an amount is inserted
  if(amount === "" || isNaN(amount)){
    res.render("index", {error: "Please enter a numeric amount", rows: cur});
  }
  //checking if both currencies are selected
  else if(a === "null" || a === "null"){
    res.render("index", {error: "Please select both currencies", rows: cur});
  }
  else  {
    let x;
    let y;
    let date = [new Date()];
    console.log(date);
    let sql = "SELECT amount amount FROM rates WHERE Currency = ?";
    let sql2 = "INSERT INTO user_activity (date, amount, converted_from, converted_to) VALUES (?,?,?,?)"
    //getting the value of the first currency
    db.get(sql, [a], (err, row) => {
      if (err) {
        throw err;
      }
      x = parseFloat(row.amount);
      //getting the value of the second currency
      db.get(sql, [b], (err, row) =>{
        if (err) {
          throw err;
        }
        //inserting user activity data to the database
        db.run(sql2, [date, amount, a, b], function(err){
          if (err) {
            return console.error(err.message);
          }
        });
        y = parseFloat(row.amount);
        let z = parseFloat(amount);
        res.render("index", {answer: amount + " " + a + " = " + z / x * y + " " + b, rows: cur});
      });
    });
  };
});

app.set("port", process.env.PORT || 3000);

app.listen(app.get("port"),function(){
  console.log("Server started on port " + app.get("port"));
})
