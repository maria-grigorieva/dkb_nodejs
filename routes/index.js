var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',

  log: 'trace'
});


router.get('/dataset_search', function(req, res, next) {
	var dataset_search = {
	  	"query": {
	     "bool": {
	        "must": [
	          {"match" : {"geometry" : "ATLAS-R2-2016-00-01-00"}},
	          {"match" : {"phys_category.keyword": "Higgs"}}
	        ]
	      }
	    }
	};

	client.search({
	  "index": "prodsys",
	  "type": "campaign",
	  "body": dataset_search
	}).then(function (resp) {
	    var hits = resp.hits.hits;
	    // var aggs = resp.aggregations.category;
	    console.log(hits);
	    //console.log(aggs);
	    res.render('dataset_search', { title: 'Express', hits: hits});
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
		  		"must": { "term": { "subcampaign": "MC16a" } },
		  		"must": { "term": { "hashtag_list": "MC16a"} },
	  			"must": { "term": { "hashtag_list": "MC16a_CP"} },
	  			"must": { "term": { "status": "done" } }
	  		}
	  	},
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
