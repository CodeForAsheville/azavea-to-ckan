// Core Libraries
var request = require('request');

var parseWKT = require('wellknown');

var stringify = require('csv-stringify');
var parseCSV = require('csv-parse');


// CKAN API
var ckan = require("node-ckan");


// Typical Express Stuff
var express = require('express');
var app = express();

var path = require('path');

app.set('port', (process.env.PORT || 3000));

var http = require('http').Server(app);

app.use('/img',express.static(path.join(__dirname, 'img')));




app.get('/cityapi', function(req, res){
	ckan.setServer("http://ckan.opencivc.com");
	ckan.setKey("0688220c-943a-4af9-a022-65ea9b03e4e6");

	city_api_url = "http://opendatacatalog.ashevillenc.gov/api/resources/"+req.query.resource;

	request.get(city_api_url, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        // Continue with your processing here.
	        object = JSON.parse(body);

	 		for(index in object.urls){
	 			url = object.urls[index];
	 			label = url.label;

	 			if(label == "CSV"){

	 				source_data_url = url.url;
	 				console.log("good", source_data_url);

	 				// OK, now let's build an object for CKAN
	 				package_name = object.name.toLowerCase().replace(/ /g,'_').replace(/[^\w-]+/g,'');

	 				// First, the package
	 				ckan_package = {
	 									title: object.name, 
	 									description: object.description, 
	 									name: package_name
	 								};


	 				console.log(ckan_package);

 					ckan.exec(
					    "package_create", 
					    ckan_package,
					     function(err, resp){
					     	console.log(err);
					 		// res.send(resp + err);

					 		ckan.exec(
							    "resource_create", 
							    {
							        package_id  : package_name,
							        description : "CSV",
							        url: source_data_url,
							       format: "csv",
							       hash: package_name
							       // name        : "myfile", // this will default to filename if not provided 
							        // mimetype    : "image/png"
							     },
							     function(err, resp){
							 		res.send(resp);


							     });


					     }
					);

					
	 			}
	 		}


		}
	});


	// ckan.exec(
	//     "resource_create", 
	//     {
	//         // file        : "/path/to/your/file.png",
	//         package_id  : "test-dataset",
	//         description : "uploading using node.js api",
	//         url: "http://opendataserver.ashevillenc.gov/geoserver/ows?service=WFS&request=GetFeature&srsName=EPSG:4326&typeName=coagis:coa_overlay_historic_districts_view&maxFeatures=5&outputFormat=csv",
	//        format: "csv"
	//        // name        : "myfile", // this will default to filename if not provided 
	//         // mimetype    : "image/png"
	//      },
	//      function(err, resp){
	//  		res.send(resp);


	//      }
	// );

	// ckan.exec(
	//     "package_create", 
	//     {
	//         name  : "prc-test",
	//         description : "uploading using node.js api",
	//         // url: "http://opendataserver.ashevillenc.gov/geoserver/ows?service=WFS&request=GetFeature&srsName=EPSG:4326&typeName=coagis:coa_overlay_historic_districts_view&maxFeatures=5&outputFormat=csv"
	//         // name        : "myfile", // this will default to filename if not provided 
	//         // mimetype    : "image/png"
	//      },
	//      function(err, resp){
	//  		// res.send(resp);


	//      }
	// );


// 	ckan.exec("package_list", function(err, resp) {

// });



});

app.get('/wkttogeojson', function(req, res){

	  source_url = req.url.replace("/wkttogeojson?id=", "");

		request.get(source_url, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		        // Continue with your processing here.

				parseCSV(body, {comment: '#'}, function(err, output){
					for(index in output){
						geo_json= parseWKT(output[index][7]);

						if(geo_json != null){
							output[index][7] = JSON.stringify(geo_json);
						}
					}
					stringify(output, function(err, csv_output){
		        	  res.send(csv_output);
					});
				});
		    }
		});
});


http.listen( (process.env.PORT || 3000), function(){
  console.log('listening on *:'+  (process.env.PORT || 3000) );
  // console.log(parseWKT('POINT(1 2)'));
});

