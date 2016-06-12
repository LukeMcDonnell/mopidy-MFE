angular.module('mopidyFE.cache', [])
.factory('cacheservice', function($q, $location) {
	var cacheVersion = "0.4.5";
	
	var sCacheMax = 10; // max number or entries for each cache
	var iCacheMax = 20; 
	var bCacheMax = 20; 
	var recentMax = 20;
	var favsMax = 600;
	var imgMax = 600;
	
	ls=window.localStorage
	//ls.clear(); //for testing
	
	if (ls.init != "true" || ls.cacheVersion != cacheVersion){
		ls.cacheVersion = cacheVersion;
		ls.init="true";
		// connection settings
		ls.ip="localhost";
		ls.port="6680";
		//cache settings
		
		// cache indexes
		ls.sCache=JSON.stringify([]);
		ls.bCache=JSON.stringify([]);
		ls.iCache=JSON.stringify([]);
		// recent & favs
		ls.recent = JSON.stringify([]);
		ls.favs = JSON.stringify([]);
		ls.imgIndex = JSON.stringify({});
		$location.path('/settings');
	}

	var favs 					= JSON.parse(ls.favs);
	var recent 				= JSON.parse(ls.recent);	
	var sCache			 	= JSON.parse(ls.sCache);
	var bCache 				= JSON.parse(ls.bCache);
	var iCache 				= JSON.parse(ls.iCache);
	var imgIndex 			= JSON.parse(ls.imgIndex);
	
	function cacheClear (){
		ls.imgIndex = JSON.stringify({});
		ls.sCache=JSON.stringify([]);
		ls.bCache=JSON.stringify([]);
		ls.iCache=JSON.stringify([]);
		
		sCache			 = JSON.parse(ls.sCache);
		bCache 			= JSON.parse(ls.bCache);
		iCache 			= JSON.parse(ls.iCache);
		imgIndex 		= JSON.parse(ls.imgIndex);
	}  
	
	
	function returnCache (data){
		var deferred = $q.defer();
		deferred.resolve(data);
		return deferred.promise;
	}
	
	return {
		//
		// IMAGE CACHE
		//
		addImage: function(album, data){
			if(typeof imgIndex[album.artist] == "undefined") imgIndex[album.artist] = {}
			if(typeof imgIndex[album.artist][album.album] != "undefined") return;
			imgIndex[album.artist][album.album] = data
		},
		
		getImage: function(album){
			if(typeof imgIndex[album.artist] != "undefined"){
				if(typeof imgIndex[album.artist][album.album] != "undefined"){
					return imgIndex[album.artist][album.album];
				}
			}
		},
		
		flushImageCache: function(){
			ls.imgIndex = JSON.stringify(imgIndex);
		},
		
		//
		// ITEMS (album/artists)
		//
		getItemCache: function(uri){
			var n = _.findIndex(iCache, { 'u': uri });
			if (n != -1){
				return ({found:true, data: returnCache(iCache[n].d)})
			}
			return ({found:false, data: null})
		},
		
		cacheItem: function(uri,data){
			iCache = JSON.parse(ls.iCache);
			var n = _.findIndex(iCache, { 'u': uri });
			if (n == -1){
				iCache.push({u: uri, d: data, ts: new Date().getTime()})
			}else {
				iCache[n].ts = new Date().getTime();
			}
			if(iCache.length > iCacheMax){
				iCache.shift();
			}
			
			ls.iCache = JSON.stringify(iCache);
		},
		
		//
		// BROSWE (album/artists)
		//
		getBrowseCache: function(uri){
			var n = _.findIndex(bCache, { 'u': uri });
			if (n != -1){
				return ({found:true, data: returnCache(bCache[n].d)})
			}
			return ({found:false, data: null})
		},
		
		cacheBrowse: function(uri,data){
			bCache = JSON.parse(ls.bCache);
			var n = _.findIndex(bCache, { 'u': uri });
			if (n == -1){
				bCache.push({u: uri, d: data, ts: new Date().getTime()})
			} else {
				bCache[n].ts = new Date().getTime();
			}
			if(bCache.length >= sCacheMax){
				bCache.shift();
			}
			ls.bCache = JSON.stringify(bCache);
		},
		
		//
		// SEARCH
		//
		getSearchCache: function(uri){
			var n = _.findIndex(sCache, { 'u': uri });
			if (n != -1){
				return ({found:true, data: returnCache(sCache[n].d)})
			}
			return ({found:false, data: null})
		},
		
		cacheSearch: function(uri,data){
			bCache = JSON.parse(ls.bCache);
			var n = _.findIndex(sCache, { 'u': uri });
			if (n == -1){
				sCache.push({u: uri, d: data, ts: new Date().getTime()})
			} else {
				sCache[n].ts = new Date().getTime();
			}
			if(sCache.length >= sCacheMax){
				sCache.shift();
			}
			ls.sCache = JSON.stringify(sCache);
		},
		
		clearSearchCache: function(){
			sCache = []
			ls.sCache = JSON.stringify(sCache);
		},
		
		cacheIndex: function(){
			var result = []
			for (var i in sCache){
				result.push({query: sCache[i].u, timestamp: sCache[i].ts});
			}
			return result;
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
		}
		
	};
});