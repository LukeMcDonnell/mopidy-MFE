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


.controller('nowplayingCtrl', function NowPlayingController($rootScope, $scope, $route, mopidyservice, lastfmservice, $window) {
	$rootScope.pageTitle = "Now Playing";
 	$rootScope.showFooter = false;
 	$rootScope.showQueue = $route.current.$$route.queue;
 	
 	$scope.$watch(function(){
     return $window.innerWidth;
  }, function(value) {
     $rootScope.pageWidth = value;
 });
 	
	function getImgs(){
		for (var i in $rootScope.trackList){					
			$rootScope.trackList[i].lfmImage = 'assets/vinyl-icon.png';
			console.log($rootScope.trackList[i]);
			// Get album image
	    lastfmservice.getTrackImage($rootScope.trackList[i].track, 'large', i, function(err, albumImageUrl, i) {
	      if (! err && albumImageUrl !== undefined && albumImageUrl !== '') {
	        $rootScope.trackList[i].lfmImage = albumImageUrl;
	        $scope.$apply();
	      }
	    });	
	  }	
	}
 	
 	if ($rootScope.showQueue){
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