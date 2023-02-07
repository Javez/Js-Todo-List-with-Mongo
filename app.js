//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:admin@cluster0.gtewdzf.mongodb.net/todolist?retryWrites=true&w=majority", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const Item = mongoose.model(
  "Item",
  itemsSchema
);

const item1 = new Item({
  name: "Hello"
});

const item2 = new Item({
  name: "Hit the + button to aff a new item"
});

const item3 = new Item({
  name: "Hit the <--- button to delete item"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find({}, function (err, results) {
    const day = date.getDate();
    if(results.length === 0) {
      Item.insertMany( defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("All data successful added")
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {listTitle: day, newListItems: results});
    }

  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();
  const item = new Item({
    name: itemName
  });
  if(listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();
  if (listName === day) {
    Item.findByIdAndRemove(req.body.checkbox, function(err) {
      if(!err) {
        console.log("We have some error with delete")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req, res) {
 
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}, function(err, foundList) {
      if(!err) {
        if(!foundList) {
          const list = new List({
            name: customListName,
            items: defaultItems
          })
          list.save();
          res.redirect("/" + customListName);
        } else {
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
  } )
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started");
});