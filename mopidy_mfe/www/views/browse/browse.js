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
	
	var currentDir = { name: null, uri: null };
	var libTlList = []
	
	if ($routeParams.uri){
		currentDir = { name: util.urlDecode($routeParams.name), uri: util.urlDecode($routeParams.uri) };
	} 
		
	mopidyservice.getLibraryItems(currentDir.uri).then(function(data) {
		cacheservice.cacheBrowse(currentDir.uri, data); 
		
		$scope.libList = data;
		
		// Check for tracks
	  if (data[0].type === 'track' || data[data.length-1].type === 'track'){
			for (var i in data){
				if (data[i].type === 'track'){
					libTlList.push(data[i].uri)
				}
			}
		}		
		
		$scope.pageReady=true;
	});
	
	$scope.playPlTrack = function(track){
		mopidyservice.addReplacePlay(track, libTlList);
	}	
	
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