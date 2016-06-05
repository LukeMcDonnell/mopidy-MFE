'use strict';

angular.module('mopidyFE.album', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/album/:id/:uri', {
    templateUrl: 'views/album/album.html',
    controller: 'albumCtrl'
  });
}])

.controller('albumCtrl', function($rootScope, $scope, $routeParams, mopidyservice, lastfmservice, cacheservice, util, $timeout) {
	$rootScope.pageTitle = "Album";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = false;
	$scope.showContext = false;
	$scope.pageReady=false;
 	$timeout(function(){$scope.showBlurBG = true; $scope.$apply();}, 500);
  
	var albumName = util.urlDecode($routeParams.id);
	var uri = util.urlDecode($routeParams.uri);
	
	$scope.albumName = albumName;
	$scope.albumImage = 'assets/vinyl-icon.png';
			
	if (albumName){
		$rootScope.pageTitle = albumName;
		$scope.album = {};
	  $scope.tracks = [];
		$scope.backend = uri.split(":")[0]
	
	  mopidyservice.getItem(uri).then(function(data) {	    
	    if (data.length > 0){
		    cacheservice.cacheItem(uri, data);
				//re-sort data if local
				data = data.sort(function(a, b){return a.track_no-b.track_no});
				
				$scope.tracks = data
	      // Extract album and artist(s) from first track.
	      $scope.album = data[0].album;	
	     	// get last FM Image.
	     	lastfmservice.getAlbumImage($scope.album, 'large', 0, function(err, albumImageUrl, i) {
          if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
            $scope.albumImage = albumImageUrl;
            for (var i in $scope.tracks){
			     		$scope.tracks[i].lfmImage = $scope.albumImage;
			     		$scope.tracks[i].album.lfmImage = $scope.albumImage;
			  		}
          }
          $scope.bgReady = true;
        });
        // prepare tracklist
        $scope.playlistUris = []
	     	for (var i in data){
	  			$scope.playlistUris.push(data[i].uri);
	  		}
	  		// done.
	     	$scope.pageReady=true;
	    }
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