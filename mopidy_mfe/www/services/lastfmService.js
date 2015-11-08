angular.module('mopidyFE.lastfm', [])
.factory('lastfmservice', function($rootScope, cacheservice) {
  
  var API_KEY= '077c9fa281240d1c38b24d48bc234940';
  var API_SECRET = '';

  var fmcache = new LastFMCache();
  var lastfm = new LastFM({
    apiKey    : API_KEY,
    apiSecret : API_SECRET,
    cache     : fmcache
  });
	
	function getAlbumDetails(data){
		if (data.__model__ === "Track" || (data.__model__ === "Ref" && data.type === "track")){
			return {artist: data.artists[0].name, album: (data.album !== null ? data.album.name : '')};
		} else if (data.__model__ === "Album" || (data.__model__ === "Ref" && data.type === "album")){
			return {artist: data.artists[0].name, album: data.name};
		}
	}

  return {
    getAlbumImage: function(track, size, i, callback) {
    	var deets = getAlbumDetails(track);
    	var data = cacheservice.getImage(deets)
    	if (data){
    		var img = _.find(data, { size: size });
    		if (img !== undefined) {
        	callback(null, img['#text'], i);
       	}
      } else {
				lastfm.album.getInfo(deets, {
	        success: function(data){
	        	cacheservice.addImage(deets, data.album.image);
	          var img = _.find(data.album.image, { size: size });
	          if (img !== undefined) {
	            callback(null, img['#text'], i);
	            $rootScope.$apply();
	          }
	        }, error: function(code, message){
	            console.log('Error #'+code+': '+message);
	            callback({ code: code, message: message}, null);
	        }
	      });
	    }
    },
    getArtistInfo: function(artistName, i, callback) {
      lastfm.artist.getInfo({artist: artistName}, {
        success: function(data){
        	data['i'] = i;
          callback(null, data);
          $rootScope.$apply();
        }, error: function(code, message){
            console.log('Error #'+code+': '+message);
            callback({ code: code, message: message}, null);
        }
      });
    }
  };
});