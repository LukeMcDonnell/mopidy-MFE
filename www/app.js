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
  'mopidyFE.settings',
  
])

.filter('split', function() {
  return function(input, splitChar, splitIndex) {
    // do some bounds checking here to ensure it has that index
    return input.split(splitChar)[splitIndex];
  }
})

.filter('shorten', function() {
  return function(input, splitChar, splitIndex) {
		if (input.length > 36){
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

.controller('AppCtrl', function AppController ($rootScope, $scope, $location, $window, mopidyservice, lastfmservice, util) {
	$rootScope.showBG = false;
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

	$scope.playTlTrack = function(track){
		mopidyservice.playTlTrack( track );
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
	
	
	
	
});
