'use strict';

angular.module('mopidyFE.nowplaying', [
	'ngRoute',
])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  
  .when('/nowplaying', {
    templateUrl: 'views/nowplaying/nowplaying.html',
 		controller: 'nowplayingCtrl',
 		queue: false
  })  
  .when('/nowplaying/queue', {
  	templateUrl: 'views/nowplaying/nowplaying.html',
    controller: 'nowplayingCtrl',
    queue: true
  });
  
}])


.controller('nowplayingCtrl', function NowPlayingController($rootScope, $scope, $route, mopidyservice, lastfmservice, $window, cacheservice) {
	$rootScope.pageTitle = "Now Playing";
 	$rootScope.showFooter = false;
 	$scope.showContext = false;
 	$rootScope.showQueue = $route.current.$$route.queue;
 	
 	$scope.$watch(function(){
     return $window.innerWidth;
  }, function(value) {
     $rootScope.pageWidth = value;
 	});
 	
	function getImgs(){
		for (var i in $rootScope.trackList){
			if ($rootScope.trackList[i].lfmImage){ break; }
			$rootScope.trackList[i].lfmImage = 'assets/vinyl-icon.png';
			// Get album image
			lastfmservice.getAlbumImage($rootScope.trackList[i].track, 'medium', i, function(err, albumImageUrl, i) {
				if (!err && albumImageUrl !== undefined && albumImageUrl !== '') {
					$rootScope.trackList[i].track.lfmImage = albumImageUrl;
					$rootScope.trackList[i].lfmImage = albumImageUrl;
				}
			});
		}
	}
 	
 	if ($rootScope.showQueue){
 		$rootScope.pageTitle = "Queue";
 		if (!$rootScope.gotTlImgs){
	 		getImgs();
	  	$rootScope.gotTlImgs = true;
	  }
	}
	
	$scope.$on('updateTl', function(event, data) {
		if (!$rootScope.gotTlImgs && $rootScope.showQueue){
	 		getImgs();
	  	$rootScope.gotTlImgs = true;
	  }
	});
 	
});