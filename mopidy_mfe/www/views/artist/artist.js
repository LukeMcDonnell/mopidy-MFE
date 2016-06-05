'use strict';

angular.module('mopidyFE.artist', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/artist/:id/:uri', {
    templateUrl: 'views/artist/artist.html',
    controller: 'artistCtrl'
  });
}])

.controller('artistCtrl', function($rootScope, $scope, $routeParams, mopidyservice, lastfmservice, cacheservice, util, $timeout) {
	$rootScope.pageTitle = "Artist";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = false;
	$scope.showContext = false;
	$scope.pageReady = false;
  $timeout(function(){$scope.showBlurBG = true; $scope.$apply();}, 500);
	
	var artistName = util.urlDecode($routeParams.id);
	var uri = util.urlDecode($routeParams.uri);
	$scope.artistName = artistName;
	
	if (artistName){
		$rootScope.pageTitle = artistName;
		$scope.artistSummary = '';
  	$scope.albums = [];
  	$scope.albumss = 0;
  	$scope.singles = 0;
  	$scope.appearson = 0;
		$scope.artistImage = 'assets/vinyl-icon.png';
		$scope.playlistUris = [];
		$scope.backend = uri.split(":")[0]
		
		// lastFM Data
		lastfmservice.getArtistInfo(artistName, 0, function(err, artistInfo) {
    	if (! err) {
    		var img = _.find(artistInfo.artist.image, { size: 'large' });
		    if (img['#text'] != undefined && img['#text'] != '') {
					$scope.artistImage = img['#text'];
					$scope.albums[0].album.artists[0].lfmImage = img['#text'];
    		}	 
    	  $scope.artistSummary = artistInfo.artist.bio.summary;
    	}
    	$scope.bgReady = true;
 		});
 		
 		// Mopidy Data
		mopidyservice.getItem(uri).then(function(data) {
			cacheservice.cacheItem(uri, data);
			var n = []; var a = 0; var allAlbums = []
			for (var i in data){
				var t = data[i]; var p = false;
				for (var j in n){
					if (t.album.uri === n[j]){
						allAlbums[j].tracks.push(t.uri); a++; p=true; break;
					}
				}
				if (!p){
					allAlbums.push({album: t.album, tracks: [t.uri]}); n.push(t.album.uri); a ++;
				}
			}
       
      $scope.albums = allAlbums;
      
			for (var i in $scope.albums) {
				// Get album image
				$scope.albums[i].album.lfmImage = 'assets/vinyl-icon.png';
        lastfmservice.getAlbumImage($scope.albums[i].album, 'large', i, function(err, albumImageUrl, i) {
          if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
            $scope.albums[i].album.lfmImage = albumImageUrl;
          }
        })
        
        // Add uris to playlist
        for (var j in $scope.albums[i].tracks){
        	$scope.playlistUris.push($scope.albums[i].tracks[j]);
        }
        
        // extract artist model
        $scope.artist = $scope.albums[0].album.artists[0]
        
        // assign album type
				if ($scope.albums[i].album.artists[0].uri === uri) {
          if ($scope.albums[i].tracks.length > 3) {
          	$scope.albums[i].type = 'album';
          	$scope.albumss ++;
         	} else {
         		$scope.albums[i].type = 'single';
         		$scope.singles ++;
         	}
        } else {
        	$scope.albums[i].type = 'appearson'; 
        	$scope.appearson ++;
        }
      }
      if($scope.albums[0]){
				$scope.albums[0].album.artists[0].lfmImage = $scope.artistImage
			}
			$scope.pageReady=true;	
		}, console.error.bind(console));
	}
	
	
	$(window).scroll(function(){			
    if ($(this).scrollTop() > (290-50)){
    	$("#launchMenu").css({'top': '50px'});
    	$("#launchMenu").css({'position': 'fixed'});
    	$('#background').css({'top': "-120px"});
    	$("#background").css({'z-index': '11'});
			$("#background").css({'clip': 'rect(0px,2000px,200px,0px'});
    } else {
    	$("#launchMenu").css({'top': '290px'});
    	$("#launchMenu").css({'position': 'absolute'});
    	$('#background').css({'top': -($(this).scrollTop() / 2) + "px"});
    	$("#background").css({'z-index': '-1'});
    	$("#background").css({'clip': 'rect(0px,2000px,2000px,0px'});
    }     
	});
	function resize(){
		if ($rootScope.widescreen){
			var w = window.innerWidth - 300;
			$("#launchMenu").css({'width': w+'px'});
			$("#list").css({'width': w+'px'});
			$("#background").css({'width': w+'px'});
			$("#info").css({'width': w+'px'});
		} else {
			$("#launchMenu").css({'width': '100%'});
			$("#list").css({'width': '100%'});
			$("#background").css({'width': '100%'});
			$("#info").css({'width': '100%'});
		}
	}
	$(window).resize(function(){
   	resize();
   	$scope.$apply();
	});
	$timeout(function(){resize(); $scope.$apply();}, 600);
	
	
});