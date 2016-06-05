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