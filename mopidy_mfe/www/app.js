'use strict';

// Declare app level module which depends on views, and components
angular.module('mopidyFE', [
  'ngRoute',
  'mopidyFE.cache',
  'mopidyFE.nowplaying',
  'mopidyFE.browse',
  'mopidyFE.playlists',
  'mopidyFE.search',
  'mopidyFE.mopidy',
  'mopidyFE.lastfm',
  'mopidyFE.util',
  'mopidyFE.artist',
  'mopidyFE.album',
  'mopidyFE.settings'
  
])

.filter('split', function() {
  return function(input, splitChar, splitIndex) {
    return input.split(splitChar)[splitIndex];
  }
})

.filter('shorten', function() {
  return function(input) {
		if (input && input.length > 30){
   		return input.substring(0, 26) + " ..."
		} else {
			return input
		}
  }
})

.filter('urlEncode', function (util) {
	return function(input){
		return util.doubleUrlEncode(input)
	}
})

.filter('formatTime', function(util){
	return function(input){
		return util.timeFromMilliSeconds(input)
	}
})

.config(['$routeProvider','$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider.otherwise({redirectTo: '/nowplaying'});
}])

.controller('AppCtrl', function AppController ($rootScope, $scope, $location, $timeout, $window, mopidyservice, lastfmservice, util, cacheservice) {
	$scope.showContext = false;
	$rootScope.online = false;
	var timerTick = 0;
	var checkPositionTimer;
  var isSeeking = false;
  var defaultTrackImageUrl = 'assets/vinyl-icon.png';

  resetCurrentTrack();
	mopidyservice.start();

	$scope.$on('mopidy:state:offline', function() {
    clearInterval(checkPositionTimer);
    resetCurrentTrack();
    $rootScope.online = false;
  });

  $scope.$on('mopidy:state:online', function(event, data) {
		updateOptions();
  	updateEvent();
  	$rootScope.online = true;
  });

  $scope.$on('mopidy:event:playbackStateChanged', function(event, data) {
  	if(data.new_state == "stopped"){
	   	updateCurrentTrack({state: "stopped", timePosition: 0});
	   	$scope.$apply();
		}
  });
  
  $scope.$on('mopidy:event:tracklistChanged', function(event, data) {
   	mopidyservice.getCurrentTrackList().then(function(trackList) {
			updateCurrentTrack({ trackList: trackList });
		});
  });  
  //
  // Playback events
  //
  $scope.$on('mopidy:event:seeked', function(event, data) {
  	updateTimePosition(data.time_position);
  });
  $scope.$on('mopidy:event:trackPlaybackStarted', function (event, data){
  	updateCurrentTrack({track: data.tl_track, timePosition: 0, state: "playing"})
  	$scope.$apply();
  }); 
  $scope.$on('mopidy:event:trackPlaybackPaused', function (event, data){
  	updateCurrentTrack({track: data.tl_track, timePosition: data.time_position, state: "paused"})
  	$scope.$apply();
  });
  $scope.$on('mopidy:event:trackPlaybackResumed', function (event, data){
  	updateCurrentTrack({track: data.tl_track, timePosition: data.time_position, state: "playing"})
  	$scope.$apply();
  }); 
  //
  // Options events
  //
  $scope.$on('mopidy:event:optionsChanged', function (event, data){
  	updateOptions()
  });
	//
	//Full Refresh
	//
	function updateEvent(timePosition, state){
		mopidyservice.getCurrentTlTrack().then(function(track) {
			mopidyservice.getTimePosition().then(function(timePosition) {
				mopidyservice.getState().then(function(state) {			
					mopidyservice.getCurrentTrackList().then(function(trackList) {
		    		updateCurrentTrack({track: track, timePosition: timePosition, state: state, trackList: trackList});
		    	});
		    });
		  });
 		});
  }
  
  function updateOptions(){
  	mopidyservice.getRandom().then(function(random) {
  		mopidyservice.getRepeat().then(function(repeat) {
  			$scope.random = random;
  			$scope.repeat = repeat;  			
  		});
		});
	}
	
  function updateCurrentTrack(data) {
  	if (data){
  		var state = data.state;
  		var timePosition = data.timePosition
  		var track = data.track
  		var trackList = data.trackList
  	}
  	
  	if (trackList){
  		$rootScope.trackList = trackList;
  		$scope.$broadcast('updateTl', "hello");
  	}
  	
  	if (state){
  		$scope.currentState = state;
      if ($scope.currentState == 'playing') {
      	clearInterval(checkPositionTimer);
        checkPositionTimer = setInterval(function() {
          updateTimePosition();
        }, 1000);                
      } else if ($scope.currentState == 'paused'){
      	clearInterval(checkPositionTimer);
      } else {
      	clearInterval(checkPositionTimer);
      }
    }
    
    if (track) {
    	$scope.currentUri = track.track.uri;
    	$scope.currentTlid = track.tlid;
      $scope.currentTrack = track.track.name;
      $scope.currentArtists = track.track.artists;
      $scope.currentAlbum = track.track.album;
      $scope.currentTrackLength = track.track.length;
      $scope.currentTrackLengthString = util.timeFromMilliSeconds(track.track.length);
			
      if ($scope.currentTrackLength > 0) {
       	$scope.currentTimePosition = ($scope.currentTrackPositionMS / $scope.currentTrackLength) * 100;
      	$scope.currentTrackPosition = util.timeFromMilliSeconds($scope.currentTrackPositionMS);
      } else {
        $scope.currentTimePosition = 0;
        $scope.currentTrackPosition = util.timeFromMilliSeconds(0);
      }
			
			$scope.currentAlbumUri = track.track.album.uri;

      if (track.track.album.images && track.track.album.images.length > 0) {
        $rootScope.currentTrackImageUrl = track.track.album.images[0];
      } else {
        lastfmservice.getAlbumImage(track.track, 'mega', 0, function(err, trackImageUrl, asdf) {
          if (! err && trackImageUrl !== undefined && trackImageUrl !== '') {
            $rootScope.currentTrackImageUrl = trackImageUrl;
          } else {
						$rootScope.currentTrackImageUrl = defaultTrackImageUrl;
          }
        });
      }
    }
    
    if (timePosition != null){ 
  		updateTimePosition(timePosition);
  	}
    
  }

  function resetCurrentTrack() {
  	$scope.currentUri = '';
  	$scope.currentTlid = null;
    $scope.currentTrack = '';
    $scope.currentAlbum = '';
    $scope.currentAlbumUri = '';
    $scope.currentArtists = [];
    $scope.currentTrackLength = 0;
    $scope.currentTrackLengthString = '0:00';
    $scope.currentTimePosition = 0; // 0-100
    $scope.currentTrackPosition = util.timeFromMilliSeconds(0);
    $rootScope.currentTrackImageUrl = defaultTrackImageUrl;
  	$scope.currentState = '';
  	$scope.currentTrackPositionMS = 0;  	
  }

  function updateTimePosition(newPosition) {
    if (!isSeeking) {
    	if (newPosition != null){
    		$scope.currentTrackPositionMS = newPosition;
    	} else {
	    	$scope.currentTrackPositionMS += 1000 
 			}
    	if ($scope.currentTrackLength > 0 && $scope.currentTrackPositionMS > 0) {
        $scope.currentTimePosition = ($scope.currentTrackPositionMS / $scope.currentTrackLength) * 100;
        $scope.currentTrackPosition = util.timeFromMilliSeconds($scope.currentTrackPositionMS);
      } else {
        $scope.currentTimePosition = 0;
        $scope.currentTrackPosition = util.timeFromMilliSeconds(0);
        
      }
      if ($scope.currentTrackPositionMS > $scope.currentTrackLength){
      	$scope.currentTrackPositionMS = $scope.currentTrackLength;
      }
      $('.footerProgressBar').stop().animate({ width: $scope.currentTimePosition +"%"	}, 1);
			$('.npProgressBar').stop().animate({ width: $scope.currentTimePosition +"%"	}, 1);
    }
    if(newPosition == null){
   		$scope.$apply();
  	}
  }
  
	//
	// Player Controls
	//
	$scope.play = function() {
    if ($scope.currentState === "playing") {
      mopidyservice.pause();
    }
    else {
      mopidyservice.play();
    }
  };
  
  $scope.previous = function() {
    mopidyservice.previous();
    if ($scope.currentState === "stopped") {
    	updateEvent(0, "stopped");
    }
  };

  $scope.next = function() {
    mopidyservice.next();
    if ($scope.currentState === "stopped") {
    	updateEvent(0, "stopped");
    }
  };

	$scope.toggleRandom = function(){
		if($scope.random){
			mopidyservice.setRandom(false);
		} else {
			mopidyservice.setRandom(true);
		}
	}
	
	$scope.toggleRepeat = function(){
		if($scope.repeat){
			mopidyservice.setRepeat(false);
		} else {
			mopidyservice.setRepeat(true);
		}
	}


  $scope.$on('mopidyFE:slidervaluechanging', function(event, value) {
    isSeeking = true;
  });

  $scope.$on('mopidyFE:slidervaluechanged', function(event, value) {
    seek(value);
    isSeeking = false;
  });

  function seek(sliderValue) {
    if ($scope.currentTrackLength > 0) {
      var milliSeconds = ($scope.currentTrackLength / 100) * sliderValue;
      mopidyservice.seek(Math.round(milliSeconds));      
    }
  }
  
  //
  // QUEUE & MAIN MENU
  //
  
  $scope.getImgs = function(){
  	if(!$scope.gotTlImgs){
			for (var i in $rootScope.trackList){
				if ($rootScope.trackList[i].lfmImage){ break; }
				$rootScope.trackList[i].lfmImage = 'assets/vinyl-icon.png';
				// Get album image
				lastfmservice.getAlbumImage($rootScope.trackList[i].track, 'medium', i, function(err, albumImageUrl, i) {
					if (!err && albumImageUrl !== undefined && albumImageUrl !== '') {
						$rootScope.trackList[i].track.lfmImage = albumImageUrl;
						$rootScope.trackList[i].lfmImage = albumImageUrl;
					}
				});
			}
			$scope.gotTlImgs = true;
		}
	}
  
	$scope.$on('updateTl', function(event, data) {
		$scope.gotTlImgs = false;
		if(queueState){
	 		$scope.getImgs();
	 	}
	});
	
	// menu
	var menuMask = document.getElementById( 'menumask' );
	var menuState= false;
	var queueState= false;
	var menuLeft = document.getElementById( 'cbp-spmenu-s1' )
	var body = document.body;
	var queueRight = document.getElementById( 'cbp-spmenu-s2' )
	
	$scope.toggleMenu = function() {
		if (menuState){
			menuMask.style.display = 'none';
			menuState = false;
		} else {
			menuMask.style.display = 'block';
			menuState = true;
		}
		if (queueState){
			classie.toggle( queueRight, 'cbp-spmenu-open' );
			queueState = false
		}
		classie.toggle( menuLeft, 'cbp-spmenu-open' );
	};
	
	// queue
	$scope.toggleQueue = function() {
		if (queueState){
			menuMask.style.display = 'none';
			queueState = false;
		} else {
			menuMask.style.display = 'block';
			queueState = true;
			$timeout(function(){$scope.getImgs()}, 1000);
		}
		if (menuState){
			classie.toggle( menuLeft, 'cbp-spmenu-open' );
			menuState = false
		}
		classie.toggle( queueRight, 'cbp-spmenu-open' );		
	};
	
	$scope.closeMenu = function(){
		if (queueState){ classie.toggle( queueRight, 'cbp-spmenu-open' ); }
		if (menuState){ classie.toggle( menuLeft, 'cbp-spmenu-open' ); }
		queueState = false;
	 	menuState = false;
	 	menuMask.style.display = 'none';
	}
	
	$scope.loadMenuItem = function(url){
		$scope.closeMenu();
		$timeout(function(){$location.path(url)}, 250);
	}
	
	
  
  //
  // QUEUE MENU
  //  
  $rootScope.queueMenu = function(context){
		$scope.contextData = []
  	$scope.contextReady	= false;	
 	
		var favs = cacheservice.getFavs();
  	var favsMenuItem = {text: "Add to Favourites", 		type: "addFavQ", data: context	};
  	for (var i in favs){
  		if(favs[i].uri === context.track.uri){
  			favsMenuItem = {text: "Remove from Favourites", 		type: "removeFavQ", data: context	};
  		}
  	}
  	
		$scope.contextData.image = context.lfmImage;
		$scope.contextData.header = context.track.name;
		
		if (context.track.artists ){ $scope.contextData.header2 = "Track by " + context.track.artists[0].name }
		$scope.contextData.buttons = []
		$scope.contextData.buttons.push({text: "Delete from queue", 	type: "QCtrl", arg: "REMOVE",	data:	context	});
		//$scope.contextData.buttons.push({text: "Move UP queue", 	type: "QCtrl", arg: "UP",	data:	context	}); 
		//$scope.contextData.buttons.push({text: "Move DOWN queue", 	type: "QCtrl", arg: "DOWN",	data:	context	});
		$scope.contextData.buttons.push(favsMenuItem);
		if (context.track.artists ){ $scope.contextData.buttons.push({text: "More From "+context.track.artists[0].name, 	type: "link",		data:"/artist/"+context.track.artists[0].name+"/"+context.track.artists[0].uri });	}
  	if (context.track.artists ){ $scope.contextData.buttons.push({text: "View Album: "+context.track.album.name , 	type: "link",		data:"/album/"+context.track.album.name+"/"+context.track.album.uri });}
		//$scope.contextData.buttons.push({text: "Start Song Radio", 		type: "play",		data:"RADIO"});
		
		$scope.contextReady = true;
		$scope.showContext = true;
	}	
  	
  	
	//
	// CONTEXT MENU
	//
  $rootScope.contextMenu = function(context){
  	$scope.contextData = []
  	$scope.contextReady	= false;
  	
  	var favs = cacheservice.getFavs();
  	var favsMenuItem = {text: "Add to Favourites", 		type: "addFav", data: context	};
  	for (var i in favs){
  		if(favs[i].uri === context.uri){
  			favsMenuItem = {text: "Remove from Favourites", 		type: "removeFav", data: context	};
  		}
  	}
  	
  	// prepare menu 	
  	if (context.__model__ === "Artist" || (context.__model__ === "Ref" && context.type === "artist")){
			$scope.contextData.image = context.lfmImage;
			$scope.contextData.header = context.name
			$scope.contextData.header2 = "Artist"
			$scope.contextData.buttons = []
			$scope.contextData.buttons.push({text: "Artist Albums", 		type: "link", 	data:"/artist/"+context.name+"/"+context.uri});
			$scope.contextData.buttons.push({text: "Related Artists", 	type: "link",		data:"/artist/"+context.name+"/"+context.uri});
			$scope.contextData.buttons.push(favsMenuItem);
			$scope.contextData.buttons.push({text: "Artist Radio", 		type: "link",		data:"/artist/"+context.name+"/"+context.uri});
			$scope.contextReady	= true;
			
  	} else if (context.__model__ === "Album" || (context.__model__ === "Ref" && context.type === "album")){
			mopidyservice.getItem(context.uri).then(function(data) {	    
		    if (data.length > 0){
			    cacheservice.cacheItem(context.uri, data);
					data = data.sort(function(a, b){return a.track_no-b.track_no});
	        context.tlUris = [];
		     	for (var i in data){
		  			context.tlUris.push(data[i].uri);
		  		}
		  		context.tracks = data;
				}
				$scope.contextReady	= true;
			})
			$scope.contextData.image = context.lfmImage;
			$scope.contextData.header = context.name
			$scope.contextData.header2 = "Album by " + context.artists[0].name
			$scope.contextData.buttons = []
			$scope.contextData.buttons.push({text: "Play Album", 		type: "playTl", 	arg:"ARP", 		data: context });
			$scope.contextData.buttons.push({text: "Queue", 				type: "playTl", 	arg:"APPEND", data: context	});
			$scope.contextData.buttons.push({text: "Play Next", 		type: "playTl", 	arg:"NEXT", 	data: context	});
			$scope.contextData.buttons.push(favsMenuItem);
			if(context.__model__ != "Ref"){
				$scope.contextData.buttons.push({text: "More From "+context.artists[0].name, 	type: "link",		data:"/artist/"+context.artists[0].name+"/"+context.artists[0].uri });	
  		}
  		$scope.contextData.buttons.push({text: "Album Page", 	type: "link",		data:"/album/"+context.name+"/"+context.uri });	

  	} else if (context.__model__ === "Track" || (context.__model__ === "Ref" && context.type === "track")){
			$scope.contextData.image = context.lfmImage;
			$scope.contextData.header = context.name
			if (context.artists ){ $scope.contextData.header2 = "Track by " + context.artists[0].name }
			$scope.contextData.buttons = []
			$scope.contextData.buttons.push({text: "Play Track", 		type: "playTrack", 	arg:"ANP", 			data: context});
			$scope.contextData.buttons.push({text: "Queue", 				type: "playTrack", 	arg:"APPEND", 	data: context });
			$scope.contextData.buttons.push({text: "Play Next", 		type: "playTrack", 	arg:"NEXT", 		data: context});
			$scope.contextData.buttons.push(favsMenuItem);
			if (context.artists ){ $scope.contextData.buttons.push({text: "More From "+context.artists[0].name, 	type: "link",		data:"/artist/"+context.artists[0].name+"/"+context.artists[0].uri });	}
  		if (context.artists ){ $scope.contextData.buttons.push({text: "View Album: "+context.album.name , 	type: "link",		data:"/album/"+context.album.name+"/"+context.album.uri });}
			//$scope.contextData.buttons.push({text: "Start Song Radio", 		type: "play",		data:"RADIO"});
			$scope.contextReady	= true;
				
  	} else if (context.__model__ === "Playlist" || (context.__model__ === "Ref" && context.type === "playlist")){
  			
			$scope.contextData.header = context.name.split('(by')[0];
			$scope.contextData.header2 = "Playlist";
			$scope.contextData.buttons = []
			
			mopidyservice.getPlaylist(context.uri).then(function(data) {
		  	data.tlUris = [];
		  	data.lfmImage = $scope.contextData.image = context.lfmImage;	  	
		  	for (var i in data.tracks){
	  			data.tlUris.push(data.tracks[i].uri);
	  		}
	  		$scope.contextData.buttons.push({text: "Play All", 		type: "playTl", 		arg:"ARP", 			data: data});
	 			$scope.contextData.buttons.push({text: "Queue", 			type: "playTl", 		arg:"APPEND", 	data: data});
  			$scope.contextData.buttons.push({text: "Play Next", 	type: "playTl", 		arg:"NEXT", 		data: data});
  			$scope.contextData.buttons.push(favsMenuItem);
	  		$scope.contextReady	= true;
	  	})		
		}
  	// show menu
  	$scope.showContext = true;
  }
  
  $rootScope.contextLink = function (type, data, arg){
  	if (type === "link"){
  		$scope.showContext = false;
  		if (queueState){
  			$scope.closeMenu();
  			$timeout(function(){ $location.path(data); }, 250);
			} else {
				$location.path(data);
			}
  	} else if (type === "playTrack"){
  		switch (arg){
  			case "ANP":
  				$rootScope.playTrackNext([data.uri]);
  				break
  			case "APPEND":
  				$rootScope.appendTrack([data.uri]);
  				break;
  			case "NEXT":
  				$rootScope.addTrackNext([data.uri]);
  				break;
  			default:
  				break;
  		}
  		$scope.showContext = false;
  	} else if (type === "playTl"){
  		switch (arg){
  			case "ARP":
  				$rootScope.addReplacePlay(data.tracks[0], data.tlUris, data);
  				break
  			case "APPEND":
  				$rootScope.appendTrack(data.tlUris, data);
  				break;
  			case "NEXT":
  				$rootScope.addTrackNext(data.tlUris, data);
  				break;
  			default:
  				break;
  		}
  		$scope.showContext = false;
  	} else if (type === "addFav"){
  		cacheservice.addFav(data);
  		$scope.contextMenu(data);
  	} else if (type === "removeFav"){
  		cacheservice.removeFav(data);
  		$scope.contextMenu(data);
  	} else if (type === "addFavQ"){
  		cacheservice.addFav(data.track);
  		$scope.queueMenu(data);
  	} else if (type === "removeFavQ"){
  		cacheservice.removeFav(data.track);
  		$scope.queueMenu(data);
  	} else if (type ==="QCtrl"){
  		switch (arg){
  			case "REMOVE":
  				mopidyservice.queueRemove([data.tlid]);
					//console.log(data);
  				break;
  			case "UP":
  				
  				break;
  			case "DOWN":
  				
  				break;
  			default:
	  			break;
	  	}
	  	$scope.showContext = false;
  		
  	}
  	
  }
  $rootScope.closeContextMenu = function(){
  	$scope.showContext = false;
  }	
  //
	// global playlist methods
	//
	$rootScope.playTlTrack = function(track){
		mopidyservice.playTlTrack( track );
	};
	
	$rootScope.addReplacePlay = function(track, uris, recent){
		if (typeof track === 'string'){ track = [ track ]; }
		mopidyservice.addReplacePlay(track, uris);
		if (recent){
			cacheservice.addRecent(recent);
		}
	};
	
	$rootScope.appendTrack = function(track, recent){
		if (typeof track === 'string'){ track = [ track ]; }
		mopidyservice.appendTrack(track);
		if (recent){
			cacheservice.addRecent(recent);
		}
	};
	$rootScope.addTrackNext = function(track, recent){
		if (typeof track === 'string'){ track = [ track ]; }
		mopidyservice.addTrackNext(track);
		if (recent){
			cacheservice.addRecent(recent);
		}
	};
	$rootScope.playTrackNext = function(track){
		if (typeof track === 'string'){ track = [ track ]; }
		mopidyservice.playTrackNext(track);
	};
	// more to come.
	
	
	//
	// Scroll control
	//
	$scope.scrollPos = {}; // scroll position of each view

	$(window).on('scroll', function() {
		if ($scope.okSaveScroll) { // false between $routeChangeStart and $routeChangeSuccess
			$scope.scrollPos[$location.path()] = $(window).scrollTop();
			//console.log($scope.scrollPos);
		}
	});
	
	$scope.scrollClear = function(path) {
		$scope.scrollPos[path] = 0;
	}
	
	$scope.$on('$routeChangeStart', function() {
		$scope.okSaveScroll = false;
	});
	
	$scope.$on('$routeChangeSuccess', function() {
		 $(window).scrollTop(0); // start at the top
    $timeout(function() { // wait for DOM, then restore scroll position
    	if(!$rootScope.noScrollSave){
        $(window).scrollTop($scope.scrollPos[$location.path()] ? $scope.scrollPos[$location.path()] : 0);
        $scope.okSaveScroll = true;
      } else {
      	$scope.okSaveScroll = true;
      	$rootScope.noScrollSave = false
  			$scope.scrollPos[$location.path()] = 0;
  		}
    }, 500);
	});
		
	
	
});
