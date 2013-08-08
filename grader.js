#!/usr/bin/env node

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

Check local file OR file provided via url (*both*, not either), OS.

Usage: 
 node grader.js -u https://raw.github.com/nexxos/bitstarter/7429225f310e9a5eea593ff2df8cd01e6cb96424/index.html
or 
 node grader.js -u  http://evening-wave-3179.herokuapp.com/
or
 node grader.js
 
Raw version of file to be checked is on github too, uploading to aws/deploying to heroku not necessary.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander'); 	// cli
var cheerio = require('cheerio');   	// dom scraper (not of Mad Men)
var restler = require('restler'); 		// for reading via url, see Usage above

var HTMLFILE_DEFAULT 	= 'index.html'; 	// identical to aforementioned raw github file 
var CHECKSFILE_DEFAULT 	= 'checks.json';


var assertFileExists = function(infile) {
		var instr = infile.toString();
		if (!fs.existsSync(instr)) {
			console.log("%s does not exist. Exiting.", instr);
			process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
		}
		return instr;
};
	
// reads file from local filesystem
var cheerioHtmlFile = function(htmlfile) {
		return cheerio.load(fs.readFileSync(htmlfile));
};
	
var loadChecks = function(checksfile) {
		return JSON.parse(fs.readFileSync(checksfile));
};
	
var checkHtmlFile = function(htmlfile, checksfile) {
		$ = cheerioHtmlFile(htmlfile);
		// var checks = loadChecks(checksfile).sort();
		var checks = loadChecks(checksfile); // results not sorted in assignment
		var out = {};
		for (var ii in checks) {
			var present = $(checks[ii]).length > 0;
			out[checks[ii]] = present;
		}
		return out;
};
	
// read/scrape file from given url 
var checkHtmlUrl = function(url, checksfile, callback) {
		var getData = function(counter) {
				if (counter <= 0) {
					// restler.get(url).on('success', function(data, response) {
					restler.get(url).on('complete', function(data, response) {
						var result = cheerio.load(data);
						var checks = loadChecks(checksfile); // results from scraping
						// loadChecks(checksfile).sort();    // sorted results
						var out = {};
						for (var ii in checks) {
							var present = result(checks[ii]).length > 0;
							out[checks[ii]] = present;
						}
						var outJson = JSON.stringify(out, null, 4);  // format output
						return callback(outJson);
					});
					getData(1);
				}
			}
		getData(0);
}
	
var clone = function(fn) {
		// Workaround for commander.js issue.
		// http://stackoverflow.com/a/6772648
		return fn.bind({});
	};
	
if (require.main == module) {
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <html_file_url>', 'URL to html file').parse(process.argv);  // read url as command line input
	
	if (program.url === undefined) {
		// result for file
		var checkJson = checkHtmlFile(program.file, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4); // format output, 4 spaces instead of tab (checkJson, null, '\t');
		console.log(outJson);
		// console.log(outJson + ' \n (checked file)');
	} else {
		// result for url
		checkHtmlUrl(program.url, program.checks, function(result) {
			if (result) {
				console.log(result);
				// console.log(result + ' \n (checked url)');
			}
		});
	}
} /*else {
	exports.checkHtmlFile = checkHtmlFile;
	exports.checkHtmlFromUrl = checkHtmlFromUrl;
}*/
