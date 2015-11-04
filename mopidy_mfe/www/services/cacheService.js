angular.module('mopidyFE.cache', [])
.factory('cacheservice', function($q, $location) {
  var sCacheMax = 20 	// max number or entries for each cache
	var iCacheMax = 100 //
	var bCacheMax = 100 //
	var recentMax = 20
	
  ls=window.localStorage
	//ls.clear(); //for testing
  
  if (ls.init != "true"){
  	ls.init="true";
  	// connection settings
		ls.ip="localhost";
		ls.port="6680";
		//cache settings
		//ls.useSearchCache="true";
		//ls.useBrowseCache="true";
		// cache indexes
		ls.sCacheIndex=JSON.stringify([]);
		ls.bCacheIndex=JSON.stringify([]);
		ls.iCacheIndex=JSON.stringify([]);
		// recent
		ls.recent = JSON.stringify([]);
		$location.path('/settings');

	}
	
//	if (!ls.recent){
		ls.recent = JSON.stringify([]);
	//}

	var recent = JSON.parse(ls.recent);	
	var sCacheIndex = JSON.parse(ls.sCacheIndex);
	var bCacheIndex = JSON.parse(ls.bCacheIndex);
	var iCacheIndex = JSON.parse(ls.iCacheIndex);
	
	function returnCache (data){
  	var deferred = $q.defer();
  	deferred.resolve(data);
  	return deferred.promise;
  }
  
  function cacheClear (){
  	var ip = ls.ip;
  	var port = ls.port;
  	
  	ls.clear()
  	
  	ls.init = "true";
  	ls.ip = ip;
  	ls.port = port;
  	
  	ls.recent = JSON.stringify([]);
  	
  	// cache indexes
		ls.sCacheIndex=JSON.stringify([]);
		ls.bCacheIndex=JSON.stringify([]);
		ls.iCacheIndex=JSON.stringify([]);
		
		sCacheIndex = JSON.parse(ls.sCacheIndex);
		bCacheIndex = JSON.parse(ls.bCacheIndex);
		iCacheIndex = JSON.parse(ls.iCacheIndex);
  }  
	
	return {
		addRecent: function(k){
			var item = JSON.parse(JSON.stringify(k));
			item.tracks = [];
			item.albumData = [];
			// check if already there
			var f=false;
			for (var i in recent){
				if (recent[i].uri === item.uri){
					recent[i].timestamp = new Date().getTime(); // found it, update timestamp and return;
					f=true;
					break;
				}
			}
			if (!f){
				// add to arr and check length
				item.timestamp = new Date().getTime();
				var l = recent.push(item);
				
				if(l >= recentMax){
					var minDate = new Date().getTime()
					var d = 0;
	  			for (var j in recent){
	  				if (recent[j].timestamp < minDate){
	  					minDate = recent[j].timestamp;
	  					d = j;
	  				}
	  			}
	  			recent.splice(d,1);
	  		}
			}
			// write to ls
			ls.recent = JSON.stringify(recent);
		},
		
		getRecent: function(){
			return JSON.parse(ls.recent);
		},
		
		getSettings: function(){
			var settings={ip: ls.ip,
				port: ls.port
			}
			return settings;
		},
		saveSettings: function(data){
			ls.ip = data.ip
			ls.port = data.port
		},
		clearCache: function(){
			cacheClear();
		},
		cacheIndex: function(){
  		return sCacheIndex;
  	},
		//
		// SEARCH
		//
    getSearchCache: function(query){
    	for (i in sCacheIndex){
    		if (sCacheIndex[i].query === query){
    			console.log("RETURNING CACHE")
    			var result = returnCache(JSON.parse(ls["sCache" + i]))
    			return ({found:true, data: result})
    		}
    	}
    	return ({found:false, data: null})
  	},
  	cacheSearch: function(query,data){
  		for (var j in sCacheIndex){
  			if(sCacheIndex[j].query === query){
  				sCacheIndex[j].timestamp = new Date().getTime()
  				ls.sCacheIndex = JSON.stringify(sCacheIndex);
  				return;
  			}
  		}  		
  		if(sCacheIndex.length >= sCacheMax){
  			var n = 1; var i = null;
  			var minDate = new Date().getTime()
  			for (var j in sCacheIndex){
  				if (sCacheIndex[j].timestamp < minDate){
  					minDate = sCacheIndex[j].timestamp;
  					i = j;
  				}
  			}
  		} else {
  			var i = sCacheIndex.length; var n = 0;
  		}
  		sCacheIndex.splice(i,n,{query: query, timestamp: new Date().getTime()});
  		ls["sCache" + i] = JSON.stringify(data);
  		ls.sCacheIndex = JSON.stringify(sCacheIndex);
  	},
  	//
		// items (album/artists)
		//
    getItemCache: function(query){
    	for (i in iCacheIndex){
    		if (iCacheIndex[i].query === query){
    			console.log("RETURNING CACHE")
    			var result = returnCache(JSON.parse(ls["iCache" + i]))
    			return ({found:true, data: result})
    		}
    	}
    	return ({found:false, data: null})
  	},
  	cacheItem: function(query,data){
  		for (var j in iCacheIndex){
  			if(iCacheIndex[j].query === query){
  				iCacheIndex[j].timestamp = new Date().getTime()
  				ls.iCacheIndex = JSON.stringify(iCacheIndex);
  				return;
  			}
  		}  		
  		if(iCacheIndex.length >= iCacheMax){
  			var n = 1; var i = null;
  			var minDate = new Date().getTime()
  			for (var j in iCacheIndex){
  				if (iCacheIndex[j].timestamp < minDate){
  					minDate = iCacheIndex[j].timestamp;
  					i = j;
  				}
  			}
  		} else {
  			var i = iCacheIndex.length; var n = 0;
  		}
  		iCacheIndex.splice(i,n,{query: query, timestamp: new Date().getTime()});
  		ls["iCache" + i] = JSON.stringify(data);
  		ls.iCacheIndex = JSON.stringify(iCacheIndex);
  	},
  	//
		// Browse
		//
    getBrowseCache: function(query){
    	for (i in bCacheIndex){
    		if (bCacheIndex[i].query === query){
    			console.log("RETURNING CACHE")
    			var result = returnCache(JSON.parse(ls["bCache" + i]))
    			return ({found:true, data: result})
    		}
    	}
    	return ({found:false, data: null})
  	},
  	cacheBrowse: function(query,data){
  		for (var j in bCacheIndex){
  			if(bCacheIndex[j].query === query){
  				bCacheIndex[j].timestamp = new Date().getTime()
  				ls.bCacheIndex = JSON.stringify(bCacheIndex);
  				return;
  			}
  		}  		
  		if(bCacheIndex.length >= bCacheMax){
  			var n = 1; var i = null;
  			var minDate = new Date().getTime()
  			for (var j in bCacheIndex){
  				if (bCacheIndex[j].timestamp < minDate){
  					minDate = bCacheIndex[j].timestamp;
  					i = j;
  				}
  			}
  		} else {
  			var i = bCacheIndex.length; var n = 0;
  		}
  		bCacheIndex.splice(i,n,{query: query, timestamp: new Date().getTime()});
  		ls["bCache" + i] = JSON.stringify(data);
  		ls.bCacheIndex = JSON.stringify(bCacheIndex);
  	}
    
  };
});