'use strict';

angular.module('mopidyFE.artist', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/artist/:id/:uri', {
    templateUrl: 'views/artist/artist.html',
    controller: 'artistCtrl'
  });
}])

.controller('artistCtrl', function($rootScope, $scope, $routeParams, mopidyservice, lastfmservice, cacheservice, util) {
	$rootScope.pageTitle = "Artist";
	$rootScope.showFooter = true;
	$scope.showContext = false;
	$scope.pageReady=false;
	
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
		
		// lastFM Data
		lastfmservice.getArtistInfo(artistName, 0, function(err, artistInfo) {
    	if (! err) {
    		var img = _.find(artistInfo.artist.image, { size: 'large' });
		    if (img['#text'] != undefined && img['#text'] != '') {
		     	$scope.artistImage = img['#text'];
    		}	 
    	  $scope.artistSummary = artistInfo.artist.bio.summary;
    	}
 		});
		// This is hacky as shit, but mopidy sucks at returning local artists via getItem... :(
		if (uri.split(":")[0] != 'local'){
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
	        // assign album type
					if ($scope.albums[i].album.artists[0].uri === uri) {
	          if (allAlbums[i].tracks.length > 3) {
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
						
				$scope.pageReady=true;	
				
			}, console.error.bind(console));
		} else { // hate it hate it hate it.
			mopidyservice.getLibraryItems(uri).then(function(data) {
				cacheservice.cacheBrowse(uri, data);
				for (var i in data){
					$scope.albumss ++;
					$scope.albums.push({album: data[i], type: "album"});
					$scope.albums[i].album.artists = [{name: artistName}];
					// Get album image
					$scope.albums[i].album.lfmImage = 'assets/vinyl-icon.png';
	        lastfmservice.getAlbumImage(data[i], 'medium', i, function(err, albumImageUrl, i) {
	          if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
	            $scope.albums[i].album.lfmImage = albumImageUrl;
	          }
	        })
				}
				$scope.pageReady=true;
			}, console.error.bind(console));
		}
	}
	
});