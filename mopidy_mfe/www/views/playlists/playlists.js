'use strict';

angular.module('mopidyFE.playlists', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  
  .when('/playlists', {
    templateUrl: 'views/playlists/playlists.html',
    controller: 'playlistsCtrl'
  })
	
	.when('/playlists/:id', {
    templateUrl: 'views/playlists/playlist.html',
    controller: 'playlistsCtrl'
  });
  
}])

.controller('playlistsCtrl', function($rootScope, $scope, mopidyservice, $routeParams, util, lastfmservice) {
	$rootScope.pageTitle = "Playlists";
	$rootScope.showFooter = true;
	$scope.showContext = false;
	$scope.pageReady = false;
	
	var plId = util.urlDecode($routeParams.id);
			
	if(!$routeParams.id){ 
		$scope.playlists = [];
		
		mopidyservice.getPlaylists().then(function(data) {
			$scope.playlists = data;
			$scope.pageReady = true;    
		}, console.error.bind(console));
				
	} else {
		mopidyservice.getPlaylist(plId).then(function(data) {
			$rootScope.pageTitle = data.name.split("(by")[0];
			$scope.playlist = data;
			$scope.playlistUris = [];
	  	for (var i in $scope.playlist.tracks){
	  		$scope.playlistUris.push($scope.playlist.tracks[i].uri);
				if (!$scope.playlist.tracks[i].lfmImage){
					$scope.playlist.tracks[i].lfmImage = 'assets/vinyl-icon.png';
					lastfmservice.getAlbumImage($scope.playlist.tracks[i], 'medium', i, function(err, albumImageUrl, i) {
						if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
							$scope.playlist.tracks[i].lfmImage = albumImageUrl;
						}
					});
				}
			}
			$scope.pageReady = true;
		});    
	}
	
});