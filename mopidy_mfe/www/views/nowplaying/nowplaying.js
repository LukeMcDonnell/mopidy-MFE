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
 	//
	// Orientation changes:
	//
	var npElement = document.getElementById( 'npElement' );
	
	function resize(){
		if (window.innerWidth > (window.innerHeight-50)){
			$scope.orientation = 'horizontal';
		} else {
			$scope.orientation = 'vertical';
		}
		npElement.style.height = (window.innerHeight) + 'px';
		
		if($rootScope.widescreen){
			$("#npBackground").css({'width': 'calc(100% - 300px)'});
		} else {
			$("#npBackground").css({'width': '100%'});
		}
		
		
		$timeout(function () {
    	$scope.$broadcast('rzSliderForceRender');
    }, 100);
	}
	$scope.$on('screenResize', function(event, data) {
		resize();
	})
	resize();	
	
});