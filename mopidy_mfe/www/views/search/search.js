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
	$scope.showContext = false;
	$scope.viewResults = "";
	
	var searchTerm = $routeParams.id;
	$scope.searchTerm = searchTerm;
		
	if(searchTerm != null && searchTerm){
		$scope.viewResults = "loading";
		$scope.artists = [];
		$scope.albums = [];
		$scope.tracks = [];
		
		// get search results
		if (searchTerm.length > 1) {
   		mopidyservice.search(searchTerm).then(function(results) {
   			cacheservice.cacheSearch(searchTerm, results);  				
				_.forEach(results, function(result) {
					for (var i in result.artists){			
						$scope.artists.push(result.artists[i]);
						if (!$scope.artists[i].lfmImage){
							$scope.artists[i].lfmImage = 'assets/vinyl-icon.png';
							// Get artist image
							lastfmservice.getArtistInfo(result.artists[i].name, i, function(err, artistInfo) {
							 	if (! err) {
									var img = _.find(artistInfo.artist.image, { size: 'medium' });
									if (img !== undefined) {
										$scope.artists[artistInfo.i].lfmImage = img['#text'];
									}
								}
							});
						} else {
							console.log("Using artist image cahce")
						}
			      if (parseInt(i) === 5){
			      	break
			      }   
					}
	   			for (var i in result.albums){					
						$scope.albums.push(result.albums[i]);
						$scope.albums[i].lfmImage = 'assets/vinyl-icon.png';
						// Get album image
		        lastfmservice.getAlbumImage(result.albums[i], 'medium', i, function(err, albumImageUrl, i) {
		          if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
		            $scope.albums[i].lfmImage = albumImageUrl;
		          }
		        });
		        if (parseInt(i) === 5){
			      	break
			      } 
	        }
	      	for (var i in result.tracks){
			      if (result.tracks[i].uri.split(":")[0] != "tunein"){
			      	var n = $scope.tracks.push(result.tracks[i]);	      	
			      }
			    }
			    $scope.viewResults = "ready"; 
	      });
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