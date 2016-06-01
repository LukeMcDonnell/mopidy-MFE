'use strict';

angular.module('mopidyFE.search', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/search', {
    templateUrl: 'views/search/search.html',
    controller: 'searchCtrl'
  })
  .when('/search/:id', {
    templateUrl: 'views/search/search.html',
    controller: 'searchCtrl'
  });
  
}])

.controller('searchCtrl', function($rootScope, $scope, $routeParams, mopidyservice, lastfmservice, cacheservice, $route) {
	$rootScope.pageTitle = "Search";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = true;
	$scope.showContext = false;
	$scope.viewResults = "";
	
	var searchTerm = $routeParams.id;
	$scope.searchTerm = searchTerm;
		
	if(searchTerm != null && searchTerm){
		$scope.viewResults = "loading";
		$scope.artists = [];
		$scope.albums = [];
		$scope.tracks = [];
		$scope.backends = [];
		
		// get search results
		if (searchTerm.length > 2) {
   		mopidyservice.search(searchTerm).then(function(results) {
   			cacheservice.cacheSearch(searchTerm, results);
   			var resultArray = { artists:[], albums:[], tracks:[] }			
				
				_.forEach(results, function(result) {
					var backend = result.uri.split(":")[0];	
					if (backend != "tunein"){		
						$scope.backends.push(backend);			
						var localArtists = [];
						var localAlbums = [];
						
						for (var i in result.tracks){		
							result.tracks[i].backend = backend;	      
			      	resultArray.tracks.push(result.tracks[i]);
			      	//force add local backend artists and albums.
			      	if (backend === "local" && result.tracks[i].album.artists){
			      		var f = false;
			      		for (var n in localArtists){
			      			if(localArtists[n].name == result.tracks[i].album.artists[0].name){ f = true; }
			      		}
			      		if (!f){
			      			result.tracks[i].album.artists[0].backend = backend
		      				resultArray.artists.push(result.tracks[i].album.artists[0]);
		      				localArtists.push(result.tracks[i].album.artists[0]);
			      		}	
			      	}
			      	if (backend === "local" && result.tracks[i].album.artists){
			      		var f = false;
			      		for (var n in localAlbums){
			      			if(localAlbums[n].name == result.tracks[i].album.name){ f = true; }
			      		}
			      		if (!f){
			      			result.tracks[i].album.backend = backend
		      				resultArray.albums.push(result.tracks[i].album);
		      				localAlbums.push(result.tracks[i].album);
			      		}	
			      	}
			      	
			      }
						for (var i in result.artists){ 
							result.artists[i].backend = backend; 
							resultArray.artists.push(result.artists[i]) 
						};
			    	for (var i in result.albums){
			    		if (!result.albums[i].artists){
			    			result.albums[i].artists = [{name: null}]
			    		}
			    		result.albums[i].backend = backend; 
			    		resultArray.albums.push(result.albums[i]) 
			    	};      
			      
			    }
			  });
				
				for (var i in resultArray.artists){
					// Get artist image
					resultArray.artists[i].lfmImage = 'assets/vinyl-icon.png';
					lastfmservice.getArtistInfo(resultArray.artists[i].name, i, function(err, artistInfo) {
					 	if (! err) {
							var img = _.find(artistInfo.artist.image, { size: 'medium' });
							if (img !== undefined) {
								resultArray.artists[artistInfo.i].lfmImage = img['#text'];
							}
						}
					});
					$scope.artists.push(resultArray.artists[i]);
				}
				
   			for (var i in resultArray.albums){
					// Get album image
					resultArray.albums[i].lfmImage = 'assets/vinyl-icon.png';
	        lastfmservice.getAlbumImage(resultArray.albums[i], 'medium', i, function(err, albumImageUrl, i) {
	          if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
	            resultArray.albums[i].lfmImage = albumImageUrl;
	          }
	        });
	        $scope.albums.push(resultArray.albums[i]);
        }
        
        $scope.tracks = resultArray.tracks;
	      $scope.viewResults = "ready"; 
			    
			})
		}
	
	} else {
		// Show recent searches maybe?
		$scope.searchHistory = _.chain(cacheservice.cacheIndex())
			.sortBy('timestamp')
			.value()
		
		$scope.searchHistory.reverse();
		
		if ($scope.searchHistory.length > 0){
			$scope.viewResults = "history";
		}
	}	
	
	$rootScope.removeHistory = function(data){
		cacheservice.clearSearchCache();
		$route.reload();
	}
	
});