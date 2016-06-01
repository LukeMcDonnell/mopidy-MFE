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
 	$rootScope.showHeaderBG = false;
 	$scope.showContext = false;
 	 	
 	$scope.$watch(function(){
     return $window.innerWidth;
  }, function(value) {
     $rootScope.pageWidth = value;
 	});
 	 	
});