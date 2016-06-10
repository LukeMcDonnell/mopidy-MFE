'use strict';

// Declare app level module which depends on views, and components
angular.module('mopidyFE', [
  'ngRoute',
  'rzModule',
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
	
  
  //
  // SLIDERS
  //
  $scope.volSlider = {
	  value: 100,
	  options: {
	  	id: "volume",
	    floor: 0,
	    ceil: 100,
	    keyboardSupport: true,
			hidePointerLabels: true,
			hideLimitLabels: true,
			showSelectionBar: true,
			onEnd: function () { mopidyservice.setVolume($scope.volSlider.value);	}
	  }
	};
  	
	$scope.seekSlider = {
	  value: 0,
	  options: {
	  	id: "seek",
	    floor: 0,
	    ceil: 100,
	    keyboardSupport: true,
			hidePointerLabels: true,
			hideLimitLabels: true,
			showSelectionBar: true,
			onStart: function () { isSeeking = true; },
			onEnd: function () { 
				isSeeking = false; 
				mopidyservice.seek($scope.seekSlider.value);
				clearInterval(checkPositionTimer);
			}
	  }
	};

  resetCurrentTrack();
	mopidyservice.start();

	//
	// EVENT HANDLERS
	//
	$scope.$on('mopidy:state:offline', function() {
    clearInterval(checkPositionTimer);
    resetCurrentTrack();
    $rootScope.online = false;
    $scope.$apply()
  });

  $scope.$on('mopidy:state:online', function(event, data) {
		updateOptions();
		updateVolume();
  	updateEvent();
  	$rootScope.online = true;
  	$scope.$apply();
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
  	updateCurrentTrack({timePosition: data.time_position});
  	$scope.$apply();
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
  $scope.$on('mopidy:event:volumeChanged', function (event, data){
  	updateVolume(data.volume)
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
	
	function updateVolume(volume){
		if(volume){
			$scope.volSlider.value = volume;
		} else {
			mopidyservice.getVolume().then(function(volume) {
				$scope.volSlider.value = volume;
			})
		}
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
    }
    
    if (track) {
    	$scope.currentUri = track.track.uri;
    	$scope.currentTlid = track.tlid;
      $scope.currentTrack = track.track.name;
      $scope.currentArtists = track.track.artists;
      $scope.currentAlbum = track.track.album;
      $scope.currentTrackLength = track.track.length;
      $scope.currentTrackLengthString = util.timeFromMilliSeconds(track.track.length);
			$scope.currentAlbumUri = track.track.album.uri;
			
			//get Images
			$rootScope.currentTrackImageUrl = defaultTrackImageUrl;
			
			var j=[{	model: track.track.album, 
								ref : {size: 'mega', id: 0, callback: function(err, albumImageUrl, id) {
									if (!err && albumImageUrl !== undefined && albumImageUrl !== '') {
										$rootScope.currentTrackImageUrl = albumImageUrl;
									}}}
				}];			
			lastfmservice.getAlbumImages(j);
     	scrollToTrack();
    }
    
    if (timePosition != null || track){ 
  		updateTimePosition(timePosition);
  	}
    
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
  
	$scope.$on('test', function(ngRepeatFinishedEvent) {
		scrollToTrack();
	});
  
  function scrollToTrack(){
		var pqElem = $("#track"+$scope.currentTlid).get(0);
		if (pqElem){
			pqElem.scrollIntoView();
		}
	}
  

  function updateTimePosition(newPosition) {
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
		if (!isSeeking) {
			$scope.seekSlider.value = $scope.currentTrackPositionMS;
			$scope.seekSlider.options.ceil = $scope.currentTrackLength
    }
    if(newPosition == null){
   		$scope.$apply();
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
		updateTimePosition(0);
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
			var j = [];
			for (var i in $rootScope.trackList){
				if ($rootScope.trackList[i].lfmImage){ break; }
				$rootScope.trackList[i].lfmImage = 'assets/vinyl-icon.png';
				j.push({ 	model: $rootScope.trackList[i].track.album, 
									ref : {size: 'medium', id: i, callback: function(err, albumImageUrl, id) {
										if (!err && albumImageUrl !== undefined && albumImageUrl !== '') {
											$rootScope.trackList[id].track.lfmImage = albumImageUrl;
											$rootScope.trackList[id].lfmImage = albumImageUrl;
										}}}
				});
			}
			lastfmservice.getAlbumImages(j);
			$scope.gotTlImgs = true;
		}
	}
  
  $scope.gotTlImgs = true;
  
	$scope.$on('updateTl', function(event, data) {
		$scope.gotTlImgs = false;
		if(queueState || $rootScope.widescreen){
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
		if (!$rootScope.widescreen){
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
		}
	};
	
	// queue
	$scope.toggleQueue = function() {
		if(!$rootScope.widescreen){
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
		}	
	};
	
	$scope.closeMenu = function(){
		if (queueState){ classie.toggle( queueRight, 'cbp-spmenu-open' ); }
		if (menuState){ classie.toggle( menuLeft, 'cbp-spmenu-open' ); }
		queueState = false;
	 	menuState = false;
	 	menuMask.style.display = 'none';
	}
	
	$scope.loadMenuItem = function(url, quickLoad){
		$scope.closeMenu();
		if (!quickLoad){
			$timeout(function(){$location.path(url)}, 300);
		} else {
			$location.path(url)
		}
	}
	
	//
  // RESIZING
  //
  function resize(){
  	if(window.innerWidth > 1200 && !$rootScope.widescreen){
  		if (queueState || menuState){ $scope.closeMenu(); }
  		$( queueRight ).removeClass("cbp-spmenu cbp-spmenu-right");
  		$( queueRight ).addClass("queuePerm");
  		$rootScope.widescreen = true;
  		$rootScope.$broadcast('widescreenChanged', true);
  		if(!$scope.gotTlImgs){
		 		$scope.getImgs();
		 	}
  	} else if (window.innerWidth <= 1200 && $rootScope.widescreen){
  		$( queueRight ).addClass("cbp-spmenu cbp-spmenu-right");
  		$( queueRight ).removeClass("queuePerm");
  		$rootScope.widescreen = false;
  		$rootScope.$broadcast('widescreenChanged', false);
  	}
  }
  
  $(window).resize(function(){
  	resize();
  	$scope.$apply();
  });
  
  resize();	
  
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

})

.directive(
"bnLazySrcQueue",
function( $window, $document ) {
    // I manage all the images that are currently being
    // monitored on the page for lazy loading.
    var lazyLoader = (function() {
        // I maintain a list of images that lazy-loading
        // and have yet to be rendered.
        var images = [];
        // I define the render timer for the lazy loading
        // images to that the DOM-querying (for offsets)
        // is chunked in groups.
        var renderTimer = null;
        var renderDelay = 100;
        // I cache the window element as a jQuery reference.
        var win = $( $window );
        var div = $("#queueScroll")
        // I cache the document document height so that
        // we can respond to changes in the height due to
        // dynamic content.
        var doc = $document;
        var documentHeight = doc.height();
        var documentTimer = null;
        var documentDelay = 2000;
        // I determine if the window dimension events
        // (ie. resize, scroll) are currenlty being
        // monitored for changes.
        var isWatchingWindow = false;
        // ---
        // PUBLIC METHODS.
        // ---
        // I start monitoring the given image for visibility
        // and then render it when necessary.
        function addImage( image ) {
            images.push( image );
            if ( ! renderTimer ) {
                startRenderTimer();
            }
            if ( ! isWatchingWindow ) {
                startWatchingWindow();
            }
        }
        // I remove the given image from the render queue.
        function removeImage( image ) {
            // Remove the given image from the render queue.
            for ( var i = 0 ; i < images.length ; i++ ) {
                if ( images[ i ] === image ) {
                    images.splice( i, 1 );
                    break;
                }
            }
            // If removing the given image has cleared the
            // render queue, then we can stop monitoring
            // the window and the image queue.
            if ( ! images.length ) {
                clearRenderTimer();
                stopWatchingWindow();
            }
        }
        // ---
        // PRIVATE METHODS.
        // ---
        // I check the document height to see if it's changed.
        function checkDocumentHeight() {
            // If the render time is currently active, then
            // don't bother getting the document height -
            // it won't actually do anything.
            if ( renderTimer ) {
                return;
            }
            var currentDocumentHeight = doc.height();
            // If the height has not changed, then ignore -
            // no more images could have come into view.
            if ( currentDocumentHeight === documentHeight ) {
                return;
            }
            // Cache the new document height.
            documentHeight = currentDocumentHeight;
            startRenderTimer();
        }
        // I check the lazy-load images that have yet to
        // be rendered.
        function checkImages() {
            // Log here so we can see how often this
            // gets called during page activity.
            //console.log( "Checking for visible images..." );
            var visible = [];
            var hidden = [];
            // Determine the window dimensions.
            var windowHeight = win.height();
            var scrollTop = win.scrollTop();
            // Calculate the viewport offsets.
            var topFoldOffset = scrollTop;
            var bottomFoldOffset = ( topFoldOffset + windowHeight );
            // Query the DOM for layout and seperate the
            // images into two different categories: those
            // that are now in the viewport and those that
            // still remain hidden.
            for ( var i = 0 ; i < images.length ; i++ ) {
                var image = images[ i ];
                if ( image.isVisible( topFoldOffset, bottomFoldOffset ) ) {
                    visible.push( image );
                } else {
                    hidden.push( image );
                }
            }
            // Update the DOM with new image source values.
            for ( var i = 0 ; i < visible.length ; i++ ) {
                visible[ i ].render();
            }
            // Keep the still-hidden images as the new
            // image queue to be monitored.
            images = hidden;
            // Clear the render timer so that it can be set
            // again in response to window changes.
            clearRenderTimer();
            // If we've rendered all the images, then stop
            // monitoring the window for changes.
            if ( ! images.length ) {
                stopWatchingWindow();
            }
        }
        // I clear the render timer so that we can easily
        // check to see if the timer is running.
        function clearRenderTimer() {
            clearTimeout( renderTimer );
            renderTimer = null;
        }
        // I start the render time, allowing more images to
        // be added to the images queue before the render
        // action is executed.
        function startRenderTimer() {
            renderTimer = setTimeout( checkImages, renderDelay );
        }
        // I start watching the window for changes in dimension.
        function startWatchingWindow() {
            isWatchingWindow = true;
            // Listen for window changes.
            win.on( "resize.bnLazySrcQueue", windowChanged );
            div.on( "scroll.bnLazySrcQueue", windowChanged );
            // Set up a timer to watch for document-height changes.
            documentTimer = setInterval( checkDocumentHeight, documentDelay );
        }
        // I stop watching the window for changes in dimension.
        function stopWatchingWindow() {
            isWatchingWindow = false;
            // Stop watching for window changes.
            win.off( "resize.bnLazySrcQueue" );
            div.off( "scroll.bnLazySrcQueue" );
            // Stop watching for document changes.
            clearInterval( documentTimer );
        }
        // I start the render time if the window changes.
        function windowChanged() {
            if ( ! renderTimer ) {
                startRenderTimer();
            }
        }
        // Return the public API.
        return({
            addImage: addImage,
            removeImage: removeImage
        });
    })();
    // ------------------------------------------ //
    // ------------------------------------------ //
    // I represent a single lazy-load image.
    function LazyImage( element ) {
        // I am the interpolated LAZY SRC attribute of
        // the image as reported by AngularJS.
        var source = null;
        // I determine if the image has already been
        // rendered (ie, that it has been exposed to the
        // viewport and the source had been loaded).
        var isRendered = false;
        // I am the cached height of the element. We are
        // going to assume that the image doesn't change
        // height over time.
        var height = null;
        // ---
        // PUBLIC METHODS.
        // ---
        // I determine if the element is above the given
        // fold of the page.
        function isVisible( topFoldOffset, bottomFoldOffset ) {
            // If the element is not visible because it
            // is hidden, don't bother testing it.
            if ( ! element.is( ":visible" ) ) {
                return( false );
            }
            // If the height has not yet been calculated,
            // the cache it for the duration of the page.
            if ( height === null ) {
                height = element.height();
            }
            // Update the dimensions of the element.
            var top = element.offset().top;
            var bottom = ( top + height );
            // Return true if the element is:
            // 1. The top offset is in view.
            // 2. The bottom offset is in view.
            // 3. The element is overlapping the viewport.
            return(
                    (
                        ( top <= bottomFoldOffset ) &&
                        ( top >= topFoldOffset )
                    )
                ||
                    (
                        ( bottom <= bottomFoldOffset ) &&
                        ( bottom >= topFoldOffset )
                    )
                ||
                    (
                        ( top <= topFoldOffset ) &&
                        ( bottom >= bottomFoldOffset )
                    )
            );
        }
        // I move the cached source into the live source.
        function render() {
            isRendered = true;
            renderSource();
        }
        // I set the interpolated source value reported
        // by the directive / AngularJS.
        function setSource( newSource ) {
            source = newSource;
            if ( isRendered ) {
                renderSource();
            }
        }
        // ---
        // PRIVATE METHODS.
        // ---
        // I load the lazy source value into the actual
        // source value of the image element.
        function renderSource() {
            element[ 0 ].src = source;
        }
        // Return the public API.
        return({
            isVisible: isVisible,
            render: render,
            setSource: setSource
        });
    }
    // ------------------------------------------ //
    // ------------------------------------------ //
    // I bind the UI events to the scope.
    function link( $scope, element, attributes ) {
        var lazyImage = new LazyImage( element );
        // Start watching the image for changes in its
        // visibility.
        lazyLoader.addImage( lazyImage );
        // Since the lazy-src will likely need some sort
        // of string interpolation, we don't want to
        attributes.$observe(
            "bnLazySrcQueue",
            function( newSource ) {
                lazyImage.setSource( newSource );
            }
        );
        // When the scope is destroyed, we need to remove
        // the image from the render queue.
        $scope.$on(
            "$destroy",
            function() {
                lazyLoader.removeImage( lazyImage );
            }
        );
    }
    // Return the directive configuration.
    return({
        link: link,
        restrict: "A"
    });
})

.directive(
"bnLazySrc",
function( $window, $document ) {
    // I manage all the images that are currently being
    // monitored on the page for lazy loading.
    var lazyLoader = (function() {
        // I maintain a list of images that lazy-loading
        // and have yet to be rendered.
        var images = [];
        // I define the render timer for the lazy loading
        // images to that the DOM-querying (for offsets)
        // is chunked in groups.
        var renderTimer = null;
        var renderDelay = 100;
        // I cache the window element as a jQuery reference.
        var win = $( $window );
        // I cache the document document height so that
        // we can respond to changes in the height due to
        // dynamic content.
        var doc = $document;
        var documentHeight = doc.height();
        var documentTimer = null;
        var documentDelay = 2000;
        // I determine if the window dimension events
        // (ie. resize, scroll) are currenlty being
        // monitored for changes.
        var isWatchingWindow = false;
        // ---
        // PUBLIC METHODS.
        // ---
        // I start monitoring the given image for visibility
        // and then render it when necessary.
        function addImage( image ) {
            images.push( image );
            if ( ! renderTimer ) {
                startRenderTimer();
            }
            if ( ! isWatchingWindow ) {
                startWatchingWindow();
            }
        }
        // I remove the given image from the render queue.
        function removeImage( image ) {
            // Remove the given image from the render queue.
            for ( var i = 0 ; i < images.length ; i++ ) {
                if ( images[ i ] === image ) {
                    images.splice( i, 1 );
                    break;
                }
            }
            // If removing the given image has cleared the
            // render queue, then we can stop monitoring
            // the window and the image queue.
            if ( ! images.length ) {
                clearRenderTimer();
                stopWatchingWindow();
            }
        }
        // ---
        // PRIVATE METHODS.
        // ---
        // I check the document height to see if it's changed.
        function checkDocumentHeight() {
            // If the render time is currently active, then
            // don't bother getting the document height -
            // it won't actually do anything.
            if ( renderTimer ) {
                return;
            }
            var currentDocumentHeight = doc.height();
            // If the height has not changed, then ignore -
            // no more images could have come into view.
            if ( currentDocumentHeight === documentHeight ) {
                return;
            }
            // Cache the new document height.
            documentHeight = currentDocumentHeight;
            startRenderTimer();
        }
        // I check the lazy-load images that have yet to
        // be rendered.
        function checkImages() {
            // Log here so we can see how often this
            // gets called during page activity.
            console.log( "Checking for visible images..." );
            var visible = [];
            var hidden = [];
            // Determine the window dimensions.
            var windowHeight = win.height();
            var scrollTop = win.scrollTop();
            // Calculate the viewport offsets.
            var topFoldOffset = scrollTop-200;
            var bottomFoldOffset = ( topFoldOffset + windowHeight + 400);
            // Query the DOM for layout and seperate the
            // images into two different categories: those
            // that are now in the viewport and those that
            // still remain hidden.
            for ( var i = 0 ; i < images.length ; i++ ) {
                var image = images[ i ];
                if ( image.isVisible( topFoldOffset, bottomFoldOffset ) ) {
                    visible.push( image );
                } else {
                    hidden.push( image );
                }
            }
            // Update the DOM with new image source values.
            for ( var i = 0 ; i < visible.length ; i++ ) {
                visible[ i ].render();
            }
            // Keep the still-hidden images as the new
            // image queue to be monitored.
            images = hidden;
            // Clear the render timer so that it can be set
            // again in response to window changes.
            clearRenderTimer();
            // If we've rendered all the images, then stop
            // monitoring the window for changes.
            if ( ! images.length ) {
                stopWatchingWindow();
            }
        }
        // I clear the render timer so that we can easily
        // check to see if the timer is running.
        function clearRenderTimer() {
            clearTimeout( renderTimer );
            renderTimer = null;
        }
        // I start the render time, allowing more images to
        // be added to the images queue before the render
        // action is executed.
        function startRenderTimer() {
            renderTimer = setTimeout( checkImages, renderDelay );
        }
        // I start watching the window for changes in dimension.
        function startWatchingWindow() {
            isWatchingWindow = true;
            // Listen for window changes.
            win.on( "resize.bnLazySrc", windowChanged );
            win.on( "scroll.bnLazySrc", windowChanged );
            // Set up a timer to watch for document-height changes.
            documentTimer = setInterval( checkDocumentHeight, documentDelay );
        }
        // I stop watching the window for changes in dimension.
        function stopWatchingWindow() {
            isWatchingWindow = false;
            // Stop watching for window changes.
            win.off( "resize.bnLazySrc" );
            win.off( "scroll.bnLazySrc" );
            // Stop watching for document changes.
            clearInterval( documentTimer );
        }
        // I start the render time if the window changes.
        function windowChanged() {
            if ( ! renderTimer ) {
                startRenderTimer();
            }
        }
        // Return the public API.
        return({
            addImage: addImage,
            removeImage: removeImage
        });
    })();
    // ------------------------------------------ //
    // ------------------------------------------ //
    // I represent a single lazy-load image.
    function LazyImage( element ) {
        // I am the interpolated LAZY SRC attribute of
        // the image as reported by AngularJS.
        var source = null;
        // I determine if the image has already been
        // rendered (ie, that it has been exposed to the
        // viewport and the source had been loaded).
        var isRendered = false;
        // I am the cached height of the element. We are
        // going to assume that the image doesn't change
        // height over time.
        var height = null;
        // ---
        // PUBLIC METHODS.
        // ---
        // I determine if the element is above the given
        // fold of the page.
        function isVisible( topFoldOffset, bottomFoldOffset ) {
            // If the element is not visible because it
            // is hidden, don't bother testing it.
            if ( ! element.is( ":visible" ) ) {
                return( false );
            }
            // If the height has not yet been calculated,
            // the cache it for the duration of the page.
            if ( height === null ) {
                height = element.height();
            }
            // Update the dimensions of the element.
            var top = element.offset().top;
            var bottom = ( top + height );
            // Return true if the element is:
            // 1. The top offset is in view.
            // 2. The bottom offset is in view.
            // 3. The element is overlapping the viewport.
            return(
                    (
                        ( top <= bottomFoldOffset ) &&
                        ( top >= topFoldOffset )
                    )
                ||
                    (
                        ( bottom <= bottomFoldOffset ) &&
                        ( bottom >= topFoldOffset )
                    )
                ||
                    (
                        ( top <= topFoldOffset ) &&
                        ( bottom >= bottomFoldOffset )
                    )
            );
        }
        // I move the cached source into the live source.
        function render() {
            isRendered = true;
            renderSource();
        }
        // I set the interpolated source value reported
        // by the directive / AngularJS.
        function setSource( newSource ) {
            source = newSource;
            if ( isRendered ) {
                renderSource();
            }
        }
        // ---
        // PRIVATE METHODS.
        // ---
        // I load the lazy source value into the actual
        // source value of the image element.
        function renderSource() {
            element[ 0 ].src = source;
        }
        // Return the public API.
        return({
            isVisible: isVisible,
            render: render,
            setSource: setSource
        });
    }
    // ------------------------------------------ //
    // ------------------------------------------ //
    // I bind the UI events to the scope.
    function link( $scope, element, attributes ) {
        var lazyImage = new LazyImage( element );
        // Start watching the image for changes in its
        // visibility.
        lazyLoader.addImage( lazyImage );
        // Since the lazy-src will likely need some sort
        // of string interpolation, we don't want to
        attributes.$observe(
            "bnLazySrc",
            function( newSource ) {
                lazyImage.setSource( newSource );
            }
        );
        // When the scope is destroyed, we need to remove
        // the image from the render queue.
        $scope.$on(
            "$destroy",
            function() {
                lazyLoader.removeImage( lazyImage );
            }
        );
    }
    // Return the directive configuration.
    return({
        link: link,
        restrict: "A"
    });
})



.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    }
});
