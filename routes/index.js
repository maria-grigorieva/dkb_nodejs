var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
const moment = require('moment');

var client = new elasticsearch.Client({
	host: 'http://144.206.234.84:9200',
	httpAuth: 'esuser:on5xo3voo0aethoe4taY',
	log: 'trace'
});
// var client = new elasticsearch.Client({
// 	host: 'http://localhost:9200',
// 	log: 'trace'
// });

router.get('/search_form', function(req, res, next) {
	res.render('search_form', { title: 'Express'});
});

router.post('/dataset_search', function(req, res, next) {
	// console.log(req.body.keywords);
	keywords_arr = req.body.keywords.split(',');
	for (var i = 0; i < keywords_arr.length; i++) {
		keywords_arr[i] = keywords_arr[i].trim();
	}
	var quotedAndSeparated = "\"" + keywords_arr.join("\" AND \"") + "\"";

	// var query_string = {
	// 	"query": {
	//     	"query_string": {
	//       		"query": "\"ATLAS-R2-2016-00-01-00\" AND \"MC16b\" AND \"BPhysics\"",
	//       	"analyze_wildcard": true
 //    		}
 //    	}
 //  	};
  	var query_string = {
		"query": {
	    	"query_string": {
	      		"query": quotedAndSeparated,
	      		"analyze_wildcard": true
    		}
    	}
  	};
	client.search({
	  "index": "prodsys",
	  "type": "MC16",
	  "body": query_string
	}).then(function (resp) {
	    var hits = resp.hits.hits;
	    console.log(hits);
	    for (var index = 0; index < hits.length; ++index) {
	    	var curr_value = hits[index]['_source'];
	    	for(var key in curr_value) {
  				var input_datasets = String(curr_value['input_datasets']).split(',');
  				var output_datasets = String(curr_value['output_datasets']).split(',');
  				curr_value['input_datasets'] = input_datasets;
  				curr_value['output_datasets'] = output_datasets;
  		// 		let m = moment();   
  		// 		var start_time = moment(curr_value['start_time'].format('dd-mm-yyyy hh:mi:ss'));
  		// 		console.log(start_time);
				// var end_time = new Date(curr_value['end_time']);
				// var duration = end_time - start_time;
				// curr_value['duration'] = duration;
  			}
	    }
	    res.render('dataset_search', { title: 'Express', search_query: quotedAndSeparated, hits: hits});
	}, function (err) {
	    console.trace(err.message);
	    res.render('error', { title: 'Express'});
	});
});
/* GET home page. */
router.get('/', function(req, res, next) {

	// client.ping({
	//   // ping usually has a 3000ms timeout
	//   requestTimeout: 1000
	// }, function (error) {
	//   if (error) {
	//     console.trace('elasticsearch cluster is down!');
	//   } else {
	//     console.log('All is well');
	//   }
	// });

	var event_summary_report = {
	  	"size": 0,
		 "query": {
		   "bool": {
		     "must": [
		       { "term": { "subcampaign.keyword": "MC16a" } },
		       { "term": { "status": "done" } }
		     ],
		     "should": [
		       { "term": { "hashtag_list": "MC16a"} },
		       { "term": { "hashtag_list": "MC16a_CP"} }
		     ]
		   }
		 },
		 "aggs": {
		   "category": {
		     "terms": {"field": "phys_category"},
		     "aggs": {
		       "step": {
		         "terms": {
		           "field": "step_name.keyword"
		         },
		         "aggs": {
		           "requested": {
		             "sum": {
		               "field": "requested_events"
		             }
		           },
		           "processed": {
		             "sum": {"field": "processed_events"}
		           }
		         }
		       }
		     }
		   }
		 }
		};

	client.search({
	  "index": "prodsys",
	  "type": "MC16",
	  "body": event_summary_report
	}).then(function (resp) {
		// console.log(resp);
		// res.render('index', { title: 'Express'});
	    // var hits = resp.hits.hits;
	    var aggs = resp.aggregations.category;
	    console.log(aggs);
	    // console.log(aggs);
	    res.render('index', { title: 'Express', aggs: aggs });
	}, function (error) {
	    console.trace(err.message);
	    res.render('index', { title: 'Express'});
	});
});

module.exports = router;
