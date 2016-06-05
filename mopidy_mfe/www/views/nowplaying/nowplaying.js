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


.controller('nowplayingCtrl', function NowPlayingController($rootScope, $scope, $route, $timeout, mopidyservice, lastfmservice, $window, cacheservice) {
	$rootScope.pageTitle = "Now Playing";
 	$rootScope.showFooter = false;
 	$rootScope.showHeaderBG = false;
 	$scope.showContext = false;
 	var npElement = document.getElementById( 'npElement' );
 	//
	// Orientation changes:
	//
	function resize(){
		if (window.innerWidth > (window.innerHeight-50)){
			$scope.orientation = 'horizontal';
		} else {
			$scope.orientation = 'vertical';
		}
		npElement.style.height = (window.innerHeight) + 'px';
		
		$timeout(function () {
    	$scope.$broadcast('rzSliderForceRender');
    }, 100);
	}
	$(window).resize(function(){
   	resize();
   	$scope.$apply();
	});
	resize();	
	
});