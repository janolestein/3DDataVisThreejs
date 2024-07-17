//Converter from EPSG:25833 the euro centric coordidante system to the world standard system WGS84
var epsg = require('epsg');
var r = require("reproject");
var proj4 = require("proj4");
// var jsonData = require("../assets/lor_planungsraeume_2021.geojson");

const fs = require('fs')
let jsonData = JSON.parse(fs.readFileSync('../assets/lor_planungsraeume_2021.geojson', 'utf-8'))
// let jsonData;
// const fileUrl = "../assets/lor_planungsraeume_2021.geojson";
// fetch(fileUrl).then(async (res)=>{
//   jsonData = await res.json()
// });
//

var conversion = r.toWgs84(jsonData, undefined, epsg);
console.log(conversion);

fs.writeFileSync("../assets/planung_conv.geojson", JSON.stringify(conversion, null, null));
