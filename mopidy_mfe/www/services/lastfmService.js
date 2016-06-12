angular.module('mopidyFE.lastfm', [])
.factory('lastfmservice', function($rootScope, cacheservice, mopidyservice) {
  
  var API_KEY= '003cbc5a4efe12e459eb12f0e4014a05';
  var API_SECRET = 'a358ab70cdefe967b6788a78a0d047bf';

  var fmcache = new LastFMCache();
  var lastfm = new LastFM({
    apiKey    : API_KEY,
    apiSecret : API_SECRET,
    cache     : fmcache
  });
	
	function getDetails(data){
		if (data.__model__ === "Track" || (data.__model__ === "Ref" && data.type === "track")){
			return {artist: data.artists[0].name, album: (data.album !== null ? data.album.name : ''), uri: data.album.uri};
		} else if (data.__model__ === "Album" || (data.__model__ === "Ref" && data.type === "album")){
			return {artist: data.artists[0].name, album: data.name, uri: data.uri};
		} else if (data.__model__ === "Artist" || (data.__model__ === "Ref" && data.type === "artist")){
			return {artist: data.name, album: '#image', uri: data.uri};
		}
		console.log(data);
	}
	var queue = {img: [], lfm: [], lfmArtist: []};
	var lastCheck = 0
	var imageTimer = null;
	
	function getLfmImg(item){
		lastfm.album.getInfo(item.details, {
      success: function(data){
      	var p = data.album.image;
      	prep = {medium: p[1]['#text'], large: p[2]['#text'], mega: p[4]['#text']};
      	cacheservice.addImage(item.details, prep);
      	for (var n in item.ref){
          var img = prep[item.ref[n].size];
          if (img !== undefined) {
            item.ref[n].callback(null, img, item.ref[n].id);
            $rootScope.$apply();
          }
        }
      }
    });
  }
  
  function getLfmArtistImg (item) {
    lastfm.artist.getInfo({artist: item.details.artist}, {
      success: function(data){
      	//console.log(data);
      	var p = data.artist.image;
      	prep = {medium: p[1]['#text'], large: p[2]['#text'], mega: p[4]['#text']};
      	//cacheservice.addImage(item.details, prep);
      	for (var n in item.ref){
          var img = prep[item.ref[n].size];
          if (img !== undefined) {
            item.ref[n].callback(null, img, item.ref[n].id);
            //$scope.$apply();
          }
        }
      }
    });
  }
  
  function getMopidyImgs(thisPass){
  	mopidyservice.getImages(thisPass).then(function(data) {
			for (var i in data){
				var n = _.findIndex(queue.img, { 'uri': i });
				if (data[i][0]){
					prep = {medium: data[i][2].uri, large: data[i][1].uri, mega: data[i][0].uri};
					cacheservice.addImage(queue.img[n].details, prep);
  				for (var j in queue.img[n].ref){
  					var img = prep[queue.img[n].ref[j].size]
  					queue.img[n].ref[j].callback(null, img, queue.img[n].ref[j].id);
  				}
				} else {
					queue.lfm.push(queue.img[n])
				}
				queue.img.splice(n,1);
			}
		});
	}	
	
	function checkForImages(){
		//console.log("Checking for images...");
		// MOPIDY GET_IMAGES()
		var thisPass = []
		if (queue.img.length){
  		var c = 0;
  		for (i in queue.img){
  			if(!queue.img[i].checked){
  				thisPass.push(queue.img[i].details.uri)
  				queue.img[i].checked=true;
  				if(c++ == 20){
  					break;
  				}
  			}
  		}
  		getMopidyImgs(thisPass);
  	}	
  	// LAST FM
  	if (queue.lfm.length) {
  		for (var i=0; i <= 20; i++){
	  		item = queue.lfm.shift();
	  		getLfmImg(item);
	      if(!queue.lfm.length){
  				break;
  			}
	    }
	  }
	  if (queue.lfmArtist.length) {
  		for (var i=0; i <= 20; i++){
	  		item = queue.lfmArtist.shift();
	  		getLfmArtistImg(item);
	      if(!queue.lfmArtist.length){
  				break;
  			}
	    }
	  }
  	// NOTHING LEFT
  	if((!queue.img.length || !thisPass.length) && !queue.lfm.length && !queue.lfmArtist.length) {
  		clearInterval(imageTimer);
  		imageTimer = null;
  		cacheservice.flushImageCache();
  	} else {
  		if (!imageTimer){
	  		imageTimer = setInterval(function() {
		      checkForImages();
		    }, 2000);
		  }
		}
	}

	function getBestQueue(data){
		backend = data.uri.split(':')[0]
		if (backend === "spotify"){
			return 'img';
		} else if (backend === "local"){
			if(data.album === "#image"){
				return 'lfmArtist'
			}
			return 'lfm';
		} else {
			return 'img';
		}	
	}
	
  return {
  	
  	getAlbumImages: function(data){
  		for (var i in data){
  			var n = getDetails(data[i].model);
  			// try cache before adding to queue
  			var cacheData = cacheservice.getImage(n)
		  	if (cacheData){
		  		var img = cacheData[data[i].ref.size];
	        data[i].ref.callback(null, img, data[i].ref.id);
		  	}	else {
		  		// determine best queue
		  		var q = getBestQueue(n);
		  		// add to queue
	  			if((j = _.findIndex(queue[q], { 'uri': n.uri })) != -1){
	  				queue[q][j].ref.push(data[i].ref);
	  			} else { 
	  				queue[q].push({details: n, uri: n.uri, ref: [data[i].ref], checked: false})
	  			};
	  		};
  		};
  		if(!imageTimer){
		  	checkForImages();
		  }
		}
		    
  };
});