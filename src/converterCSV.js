let csvToJson = require('convert-csv-to-json');

let fileInputName = '../assets/BFw_planning_room_data_2024.csv'; 
let fileOutputName = '../assets/BFw_planning_room_data_2024.json';

csvToJson.generateJsonFileFromCsv(fileInputName,fileOutputName);
