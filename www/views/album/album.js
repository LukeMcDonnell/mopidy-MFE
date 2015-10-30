'use strict';

angular.module('mopidyFE.album', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/album/:id/:uri', {
    templateUrl: 'views/album/album.html',
    controller: 'albumCtrl'
  });
}])

.controller('albumCtrl', function($rootScope, $scope, $routeParams, mopidyservice, lastfmservice, cacheservice, util) {
	$rootScope.pageTitle = "Album";
	$rootScope.showFooter = true;
	$scope.pageReady=false;
	
	var albumName = util.urlDecode($routeParams.id);
	var uri = util.urlDecode($routeParams.uri);
	$scope.albumName = albumName;
		
	if (albumName){
		$rootScope.pageTitle = albumName;
		$scope.album = {};
	  $scope.tracks = [];
	
	  mopidyservice.getItem(uri).then(function(data) {	    
	    if (data.length > 0){
		    cacheservice.cacheItem(uri, data);
	
				//re-sort data if local
				if (uri.split(":")[0] === 'local'){
					data = data.sort(function(a, b){return a.track_no-b.track_no});
				}
	      
	      $scope.tracks = data
	      $scope.albumImage = 'assets/vinyl-icon.png';
	      
	      // Extract album and artist(s) from first track.
	      var firstTrack = $scope.tracks[0];
	      $scope.album = firstTrack.album;
	      	
	     	// get last FM Image.
	     	lastfmservice.getAlbumImage($scope.album, 'large', 0, function(err, albumImageUrl, i) {
          if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
            $scope.albumImage = albumImageUrl;
            $scope.$apply();
          }
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
	
	$scope.playPlTrack = function(track){
		mopidyservice.addReplacePlay(track, $scope.playlistUris);
	}
	
});