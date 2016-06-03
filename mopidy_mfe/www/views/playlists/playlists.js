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

.controller('playlistsCtrl', function($rootScope, $scope, mopidyservice, $routeParams, util, lastfmservice, $timeout) {
	$rootScope.pageTitle = "Playlists";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = true;
	$scope.showContext = false;
	$scope.pageReady = false;
  $timeout(function(){$scope.showBlurBG = true; $scope.$apply();}, 500);
	$scope.bgReady = true;
	
	var plId = util.urlDecode($routeParams.id);
			
	if(!$routeParams.id){ 
		$scope.playlists = [];
		
		mopidyservice.getPlaylists().then(function(data) {
			for (var i in data){
				data[i].lfmImage = 'assets/vinyl-icon.png';
			}
			
			$scope.playlists = data;
			$scope.pageReady = true;    
		}, console.error.bind(console));
				
	} else {
		$rootScope.showHeaderBG = false;
		$scope.backend = plId.split(":")[0]
		$scope.plImage = 'assets/vinyl-icon.png';

		
		mopidyservice.getPlaylist(plId).then(function(data) {
			$rootScope.pageTitle = data.name.split("(by")[0];
			data.lfmImage = 'assets/vinyl-icon.png';
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