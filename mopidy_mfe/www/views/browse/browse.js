'use strict';

angular.module('mopidyFE.browse', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/browse/', {
    templateUrl: 'views/browse/browse.html',
    controller: 'browseCtrl'
  })
  
  .when('/browse/:uri/:name?', {
    templateUrl: 'views/browse/browse.html',
    controller: 'browseCtrl'
  })
  
}])

.controller('browseCtrl', function($rootScope, $scope, $routeParams, $location, mopidyservice, util, cacheservice) {
	$rootScope.pageTitle = "Browse";
	$rootScope.showFooter = true;
	$scope.pageReady = false;
	$scope.showHome = true;
	
	var currentDir = { name: null, uri: null };
	$scope.libTlList = []
	
	if ($routeParams.uri){
		currentDir = { name: util.urlDecode($routeParams.name), uri: util.urlDecode($routeParams.uri) };
		$scope.showHome = false;
	} 
		
	mopidyservice.getLibraryItems(currentDir.uri).then(function(data) {
		cacheservice.cacheBrowse(currentDir.uri, data); 
		
		$scope.libList = data;
		
		// Check for tracks
	  if (data[0].type === 'track' || data[data.length-1].type === 'track'){
			for (var i in data){
				if (data[i].type === 'track'){
					$scope.libTlList.push(data[i].uri)
				}
			}
		}		
		
		if ($scope.showHome){
			$rootScope.pageTitle = "My Music";
			for (var i in $scope.libList){
				var folder = $scope.libList[i].name
				if (folder === "Local media"){
						$scope.libList[i].icon = "fa fa-home fa-2x";
				} else if (folder === "Spotify"){
						var spot = i;
				} else if (folder === "Spotify Browse"){
						$scope.libList[i].icon = "fa fa-spotify fa-2x";
				} else if (folder === "TuneIn"){
						$scope.libList[i].icon = "fa fa-rss fa-2x"
				}
			}
			if (spot){ $scope.libList.splice(spot,1); }
			$scope.recentList = []
			var recent = _.chain(cacheservice.getRecent())
					.sortBy('timestamp')
					.value()
			recent.reverse();
			if (recent){
				for (var i in recent){
					if (recent[i].__model__ === "Album"){
						var obj = {
							line1: recent[i].name,
							line2: "Album (by " + recent[i].artists[0].name +")",
							uri: "#/album/"+recent[i].name+"/"+recent[i].uri,
							timestamp: recent[i].timestamp,
							lfmImage: recent[i].lfmImage
						}
					} else if (recent[i].__model__ === "Playlist"){
						var obj = {
							line1: recent[i].name.split('(by')[0],
							line2: "Playlist (by " + recent[i].name.split('(by')[1],
							uri: "#/playlists/"+recent[i].uri,
							timestamp: recent[i].timestamp,
							lfmImage: recent[i].lfmImage
						}
					}
					if(obj){
						$scope.recentList.push(obj);
					}					
				}
			}
		} 	
		
		$scope.pageReady=true;
	});
	
	$scope.getUrl = function(type, uri, name){
		uri = util.urlEncode(uri);
		name = util.urlEncode(name);
		if (type === 'artist'){
			$location.path('/artist/'+name+'/'+uri+'/');
		} else if (type === 'album'){
			$location.path('/album/'+name+'/'+uri+'/');
		} else if (type === 'playlist'){
			$location.path('/playlists/'+uri+'/');
		} else {
			$location.path('/browse/'+uri+'/');
		}
	}
	
	
	
	
});