angular.module('mopidyFE.cache', [])
.factory('cacheservice', function($q, $location) {
  var sCacheMax = 10; // max number or entries for each cache
	var iCacheMax = 20; 
	var bCacheMax = 20; 
	var recentMax = 20;
	var favsMax = 600;
	var imgMax = 600;
	
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
		// recent & favs
		ls.recent = JSON.stringify([]);
		ls.favs = JSON.stringify([]);
		ls.imgIndex = JSON.stringify([]);
		$location.path('/settings');

	}
	
	if (!ls.recent){
		ls.recent = JSON.stringify([]);
	}
	if (!ls.favs){
		ls.favs = JSON.stringify([]);
	}
	if (!ls.imgIndex){
		ls.imgIndex = JSON.stringify([]);
	}

	var favs = JSON.parse(ls.favs);
	var recent = JSON.parse(ls.recent);	
	var sCacheIndex = JSON.parse(ls.sCacheIndex);
	var bCacheIndex = JSON.parse(ls.bCacheIndex);
	var iCacheIndex = JSON.parse(ls.iCacheIndex);
	var imgIndex = JSON.parse(ls.imgIndex);
	
	function returnCache (data){
  	var deferred = $q.defer();
  	deferred.resolve(data);
  	return deferred.promise;
  }
  
  function cacheClear (){
  	//var ip = ls.ip;
  	//var port = ls.port;
  	
  	//ls.clear()
  	
  	//ls.init = "true";
  	//ls.ip = ip;
  	//ls.port = port;
  	
  	//ls.recent = JSON.stringify([]);
  	//ls.favs = JSON.stringify(favs);
  	
  	var i = 0
		while (i <= sCacheMax){
			if (ls["sCache" + i]){
				ls["sCache" + i].delete;
			}
			i++;
		}
  	
  	ls.imgIndex = JSON.stringify([]);
  	// cache indexes
		ls.sCacheIndex=JSON.stringify([]);
		ls.bCacheIndex=JSON.stringify([]);
		ls.iCacheIndex=JSON.stringify([]);
		
		sCacheIndex = JSON.parse(ls.sCacheIndex);
		bCacheIndex = JSON.parse(ls.bCacheIndex);
		iCacheIndex = JSON.parse(ls.iCacheIndex);
  }  
	
	return {
		//
		// IMAGE CACHE
		//
		addImage: function(album, data){
			for (var i in imgIndex){
				if (imgIndex[i][0] === album.artist){
					for (var n in imgIndex[i][1]){
						if (imgIndex[i][1][n][0] === album.album){
							return;
						}
					}
					imgIndex[i][1].push([album.album, data]);
					ls.imgIndex = JSON.stringify(imgIndex)
					return;
				}
			}
			imgIndex.push([album.artist,[[album.album, data]]]);
			if (imgIndex.length > imgMax){
				imgIndex.splice(ImgIndex.length - 1, 1);
			}
			ls.imgIndex = JSON.stringify(imgIndex); // This probably isn't a good idea...
		},
		
		getImage: function(album){
			for (var i in imgIndex){
				if (imgIndex[i][0] === album.artist){
					for (var n in imgIndex[i][1]){
						if (imgIndex[i][1][n][0] === album.album){
							var j = imgIndex.splice(i,1)[0]; 
							imgIndex.push(j);
							return j[1][n][1];
						}
					}
				}
			}		
		},
		
		flushImage: function(){
			ls.imgIndex = JSON.stringify(imgIndex);
		},
		
		// 
		// RECENT
		//
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
			return recent;
		},
		
		//
		// FAVOURITES
		//
		addFav: function(k){
			console.log(k);
			var item = JSON.parse(JSON.stringify(k));
			item.tracks = [];
			item.albumData = [];
			// check if already there
			var f=false;
			for (var i in favs){
				if (favs[i].uri === item.uri){
					favs[i].timestamp = new Date().getTime(); // found it, update timestamp and return;
					f=true;
					break;
				}
			}
			if (!f){
				// add to arr and check length
				item.timestamp = new Date().getTime();
				var l = favs.push(item);
				
				if(l >= favsMax){
					var minDate = new Date().getTime()
					var d = 0;
	  			for (var j in favs){
	  				if (favs[j].timestamp < minDate){
	  					minDate = favs[j].timestamp;
	  					d = j;
	  				}
	  			}
	  			favs.splice(d,1);
	  		}
			}
			// write to ls
			ls.favs = JSON.stringify(favs);
		},
		
		getFavs: function(){
			return favs;
		},
		
		removeFav: function(k){
			for (var i in favs){
				if (favs[i].uri === k.uri){
					favs.splice(i,1);
				}
			}
			ls.favs = JSON.stringify(favs);
		},
		
		//
		// SETTINGS
		//
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
		//
		// SEARCH
		//
		clearSearchCache: function(){
			var i = 0
			while (i <= sCacheMax){
				if (ls["sCache" + i]){
					ls["sCache" + i].delete;
				}
				i++;
			}
			sCacheIndex = []
			ls.sCacheIndex = JSON.stringify(sCacheIndex);
		},
		
		cacheIndex: function(){
  		return sCacheIndex;
  	},
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