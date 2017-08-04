var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',

  log: 'trace'
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
		"aggs": {
	        "category": {
	          "terms": {"field": "phys_category.keyword"},
	          "aggs": {
	                "step": {
	                    "terms": {"field": "step_name.keyword"},
	                    "aggs": {
	                        "requested": {
	                            "sum": {"field": "requested_events"}
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
	  "index": "mc16",
	  "type": "event_summary",
	  "body": event_summary_report
	}).then(function (resp) {
	    var hits = resp.hits.hits;
	    var aggs = resp.aggregations.category;
	    console.log(resp);
	    console.log(aggs);
	    res.render('index', { title: 'Express', hits: hits, aggs: aggs });
	}, function (err) {
	    console.trace(err.message);
	    res.render('index', { title: 'Express'});
	});
});

module.exports = router;
