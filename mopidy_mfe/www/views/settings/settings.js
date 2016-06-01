'use strict';

angular.module('mopidyFE.settings', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/settings', {
    templateUrl: 'views/settings/settings.html',
    controller: 'settingsCtrl'
  })
    
}])

.controller('settingsCtrl', function($rootScope, $scope, cacheservice, mopidyservice) {
	$rootScope.pageTitle = "Settings";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = true;
	$scope.showContext = false;
	
	var settings = cacheservice.getSettings();
	$scope.ip = settings.ip
	$scope.port = settings.port
	
	
	
	$scope.saveSettings = function(){
		console.log("SAVE SETTINGS")
		//console.log($scope.ip)
		//console.log($scope.port)
		cacheservice.saveSettings({ip: $scope.ip, port: $scope.port});
		mopidyservice.restart();
		window.alert("Settings updated!");
	}
	
	$scope.clearCache = function(){
		console.log("CLEAR CACHE")
		cacheservice.clearCache();
		window.alert("Cache cleared!");
	}
	
	
});