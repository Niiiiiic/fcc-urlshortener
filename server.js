'use strict';
var countID;
var exists = false;
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
const db = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })

var Schema = mongoose.Schema;

var urlSchema = new Schema({
    urlOrig: String,
    short_url: Number
      });/* = <Your Model> */

var url = mongoose.model('url', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}));
//app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
//check if url valid
function checkURL(urlDNS) {
      const options = {
      family: 4,
      hints: dns.ADDRCONFIG | dns.V4MAPPED,
    };
  
  return dns.lookup(urlDNS, options, function(err, address, family) {
      if (err) {
        console.log(err)
        return false
      } else {
        return true
      }
})
  
}

//check if web address is already in database then return a short url
function checkDatabase(urlAddress) {
  console.log('im in the checkdatabase', urlAddress)
  url.findOne({urlOrig: urlAddress}, function(err, data) {
    console.log('first',data)
    if (err || !data) {
      console.log('err',err);
      url.findById('5d83bf4690508b3b60c2bbea',function(err, data1) {
            if (err) {
            return err;
            } else {
              var j = data1["short_url"];
              console.log('j',j);
              let newCount = j + 1;
            // data.count = data.count + 1;
              data1.short_url = newCount;
              console.log('new' ,newCount,'url', data1.short_url);
              
            data1.save().then(response => {
              console.log('res',response);
              countID = response.short_url;
              return countID
            }).catch(error => {
              return '{error: could not update database}'
            })
              
        //      function (err, data2){
        //          if (err) {
        //          return err;
        //          } else {
        //          return countID = data2.count;
        //          }
        //    })  
            }
      })
    } else {
      console.log('yes in database', data);
      console.log(data["short_url"]);
      countID = data["short_url"]
      exists = true;
      console.log('count', countID)
      return data["short_url"]
    }
  })
}

//Add new urls to database
app.post("/api/shorturl/new", function(req, res) {
var urlDNS = (req.body.url).split('.')[1]+'.'+(req.body.url).split('.')[2].substring(0, 3);
checkDatabase(req.body.url)

  console.log('url',req.body.url)
  
  setTimeout( () => {
  console.log('value',countID)  
    if (exists) {
      res.json({"original_url":req.body.url,"short_url": countID});
    }     
    else if (countID>=0) {
    if (checkURL(urlDNS)) {
var createURL = new url({urlOrig: req.body.url, short_url: countID});  
createURL.save().then(url => {
  console.log(url);
  res.json({"original_url":req.body.url,"short_url": countID});
}).catch(err => {
  console.log(err)
  res.json({"error":"invalid URL"})
})  
} else {
  console.log('invalid url') 
  res.json({"error":"invalid URL"})
}
} else {
  res.json({"error":"Cannot find Count"})
}  
  //console.log(countID);
},500);
});

//app.route('/api/shorturl/new').post(function(req, res, next) {
//  let urlDNS = (req.body.url).split('.')[1]+'.'+(req.body.url).split('.')[2].substring(0, 3);
//  
//  console.log(req.body.url);
//  console.log('im in the success dns');
//  if (checkURL(urlDNS)) {
//    console.log('vaild url')
//  } else {
//    console.log('invalid url')    
//  }
//  
//        
//  return createURL.save(function(err, data) {
//            console.log('im in the save')
//                    if (err) {
//                      return console.log(err);
//                   } else {        
//                      res.json({"original_url":req.body.url,"short_url":data._id})
//                      console.log('address: %j family: IPv%s', 'address', 'family')
 //                     return console.log('id',data._id);
//                    }
//          })
//        // return res.json({address:' address', family: 'family'})
//}, function(done){
//  
//})

//goto a short url
app.get("/api/shorturl/:id", function (req, res){
  //console.log('im here')
  //console.log(req.params.id)
  var num = parseInt(req.params.id)
  console.log(num)
  url.find({short_url: num}, function(err, data) {
    if (err) {
     console.log(err);
     return err;
    } else {
      if(data.length>1) {
      console.log('array',data[1]["_id"]);
      var urlOrig1 = data[1]["urlOrig"];
      } else {
      console.log('single',data);
      var urlOrig1 = data[0]["urlOrig"];
      }
      return res.redirect(urlOrig1)
    }
  
})
})
        
app.listen(port, function () {
  console.log('Node.js listening ...');
});