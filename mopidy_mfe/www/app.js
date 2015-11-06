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
    // do some bounds checking here to ensure it has that index
    return input.split(splitChar)[splitIndex];
  }
})

.filter('shorten', function() {
  return function(input) {
		if (input && input.length > 36){
   		return input.substring(0, 33) + "..."
		} else {
			return input
		}
  }
})

.filter('urlEncode', function (util) {
	return function(input){
		return util.urlEncode(input)
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

.controller('AppCtrl', function AppController ($rootScope, $scope, $location, $window, mopidyservice, lastfmservice, util, cacheservice) {
	$rootScope.showBG = true;
	$scope.showContext = false;
	var checkPositionTimer;
  var isSeeking = false;
  var defaultTrackImageUrl = 'assets/vinyl-icon.png';

  resetCurrentTrack();
	mopidyservice.start();

	$scope.$on('mopidy:state:offline', function() {
    clearInterval(checkPositionTimer);
    resetCurrentTrack();
  });

  $scope.$on('mopidy:state:online', function(event, data) {
  	updateEvent();
  });

  $scope.$on('mopidy:event:playbackStateChanged', function(event, data) {
   	updateCurrentTrack({state: data.new_state});

  });
  
  $scope.$on('mopidy:event:tracklistChanged', function(event, data) {
   	mopidyservice.getCurrentTrackList().then(function(trackList) {
			updateCurrentTrack({ trackList: trackList });
		});
  });  
  
  $scope.$on('mopidy:event:seeked', function(event, data) {
  	updateTimePosition(data.time_position);
  });
  
  $scope.$on('mopidy:event:trackPlaybackStarted', function (event, data){
  	updateCurrentTrack({track: data.tl_track, timePosition: 0, state: "playing"})
  }); 
  $scope.$on('mopidy:event:trackPlaybackPaused', function (event, data){
  	updateCurrentTrack({track: data.tl_track, timePosition: data.time_position, state: "paused"})
  }); 

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
	
  function updateCurrentTrack(data) {
  	if (data){
  		var state = data.state;
  		var timePosition = data.timePosition
  		var track = data.track
  		var trackList = data.trackList
  	}
  	
  	if (trackList){
  		$rootScope.trackList = trackList
  		$rootScope.gotTlImgs = false;
  		$scope.$broadcast('updateTl', "hello");
  	}
  	
  	if (timePosition != null){ 
  		$scope.currentTrackPositionMS = timePosition;
  	}
  	
  	if (state){
  		$scope.currentState = state;
      if ($scope.currentState === 'playing') {
      	clearInterval(checkPositionTimer);
        checkPositionTimer = setInterval(function() {
          updateTimePosition();
        }, 1000);                
      } else if ($scope.currentState === 'paused'){
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
			//$scope.currentTrackPositionMS = timePosition;
			
      if ($scope.currentTrackLength > 0) {
       	$scope.currentTimePosition = ($scope.currentTrackPositionMS / $scope.currentTrackLength) * 100;
      	$scope.currentTrackPosition = util.timeFromMilliSeconds($scope.currentTrackPositionMS);
      }
      else
      {
        $scope.currentTimePosition = 0;
        $scope.currentTrackPosition = util.timeFromMilliSeconds(0);
      }
			
			$scope.currentAlbumUri = track.track.album.uri;

      if (track.track.album.images && track.track.album.images.length > 0) {
        $rootScope.currentTrackImageUrl = track.track.album.images[0];
      } else {
        lastfmservice.getTrackImage(track.track, 'large', 0, function(err, trackImageUrl, asdf) {
          if (! err && trackImageUrl !== undefined && trackImageUrl !== '') {
            $rootScope.currentTrackImageUrl = trackImageUrl;
          }
          else
          {
            $rootScope.currentTrackImageUrl = defaultTrackImageUrl;
          }
          $scope.$apply();
        });
      }
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
    if (! isSeeking) {
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
        
      };
    }
    $scope.$apply();
  }

	// Player Controls

	$scope.play = function() {
    if ($scope.currentState === "playing") {
      // pause
      mopidyservice.pause();
    }
    else {
      // play
      mopidyservice.play();
    }
  };
  
  $scope.previous = function() {
    mopidyservice.previous();
  };

  $scope.next = function() {
    mopidyservice.next();
  };

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
	// CONTEXT MENU
	//
  $rootScope.contextMenu = function(context){
  	console.log(context);
  	$scope.contextData = []
  	$scope.contextReady	= false;
  	// prepare menu
  	if (context.__model__ === "Artist"){
  			$scope.contextData.image = context.lfmImage;
  			$scope.contextData.header = context.name
  			$scope.contextData.header2 = "Artist"
  			$scope.contextData.buttons = []
  			$scope.contextData.buttons.push({text: "View Artist Albums", 		type: "link", 	data:"/artist/"+context.name+"/"+context.uri});
  			$scope.contextData.buttons.push({text: "View Related Artists", 	type: "link",		data:"/artist/"+context.name+"/"+context.uri});
  			$scope.contextData.buttons.push({text: "Add to Favourites", 		type: "addFav", data: context	});
  			//$scope.contextData.buttons.push({text: "Start Artist Radio", 		type: "link",		data:"/artist/"+context.name+"/"+context.uri});
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
  			$scope.contextData.buttons.push({text: "Add, Replace and Play Album", type: "playTl", 	arg:"ARP", 		data: context });
  			$scope.contextData.buttons.push({text: "Add to Queue: End", 					type: "playTl", 	arg:"APPEND", data: context	});
  			$scope.contextData.buttons.push({text: "Add to Queue: Next", 					type: "playTl", 	arg:"NEXT", 	data: context	});
  			$scope.contextData.buttons.push({text: "Add to Favourites", 					type: "addFav", data: context	});
  			if(context.__model__ != "Ref"){
  				$scope.contextData.buttons.push({text: "More From "+context.artists[0].name, 	type: "link",		data:"/artist/"+context.artists[0].name+"/"+context.artists[0].uri });	
	  		}
	  		$scope.contextData.buttons.push({text: "View Album Page", 	type: "link",		data:"/album/"+context.name+"/"+context.uri });	

  	} else if (context.__model__ === "Track"){
  			$scope.contextData.image = context.lfmImage;
  			$scope.contextData.header = context.name
  			$scope.contextData.header2 = "Track by " + context.artists[0].name
  			$scope.contextData.buttons = []
  			$scope.contextData.buttons.push({text: "Add and Play Track", 		type: "playTrack", 	arg:"ANP", 			data: context});
  			$scope.contextData.buttons.push({text: "Add to Queue: End", 		type: "playTrack", 	arg:"APPEND", 	data: context });
  			$scope.contextData.buttons.push({text: "Add to Queue: Next", 		type: "playTrack", 	arg:"NEXT", 		data: context});
  			$scope.contextData.buttons.push({text: "More From "+context.artists[0].name, 	type: "link",		data:"/artist/"+context.artists[0].name+"/"+context.artists[0].uri });	
	  		$scope.contextData.buttons.push({text: "View Album: "+context.album.name , 	type: "link",		data:"/album/"+context.album.name+"/"+context.album.uri });
  			//$scope.contextData.buttons.push({text: "Start Song Radio", 		type: "play",		data:"RADIO"});
				$scope.contextReady	= true;
				
  		} else if (context.__model__ === "Ref" && context.type === "playlist"){
  			$scope.contextData.header = context.name.split('(by')[0];
  			$scope.contextData.header2 = "Playlist";
  			$scope.contextData.buttons = []
  			
  			mopidyservice.getPlaylist(context.uri).then(function(data) {
			  	data.tlUris = [];		  	
			  	for (var i in data.tracks){
		  			data.tlUris.push(data.tracks[i].uri);
		  		}		  				  		
		  		$scope.contextData.buttons.push({text: "Add, Replace and Play", type: "playTl", 		arg:"ARP", 			data: data});
 		 			$scope.contextData.buttons.push({text: "Add to Queue: End", 		type: "playTl", 		arg:"APPEND", 	data: data});
	  			$scope.contextData.buttons.push({text: "Add to Queue: Next", 		type: "playTl", 		arg:"NEXT", 		data: data});
	  			$scope.contextData.buttons.push({text: "Add to Favourites", 					type: "addFav", data: data	});
		  		$scope.contextReady	= true;
		  	})		
			}
			//$scope.contextData.buttons.push({text: "Close", type: "close", data: null});
  	// show menu
  	$scope.showContext = true;
  }
  
  $rootScope.contextLink = function (type, data, arg){
  	$scope.showContext = false;
  	if (type === "link"){
  		$location.path(data);
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
  	} else if (type === "addFav"){
  		cacheservice.addFav(data);
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
	}
	$rootScope.addTrackNext = function(track, recent){
		if (typeof track === 'string'){ track = [ track ]; }
		mopidyservice.addTrackNext(track);
		if (recent){
			cacheservice.addRecent(recent);
		}
	}
	$rootScope.playTrackNext = function(track){
		if (typeof track === 'string'){ track = [ track ]; }
		mopidyservice.playTrackNext(track);
	}
	// more to come.
	
	
});
