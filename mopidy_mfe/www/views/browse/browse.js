'use strict';

angular.module('mopidyFE.browse', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/browse/', {
    templateUrl: 'views/browse/browse.html',
    controller: 'browseCtrl'
  })
  
  .when('/browse/:uri/:name?', {
    templateUrl: 'views/browse/browse.html',
    controller: 'browseCtrl'
  })
  
}])

.controller('browseCtrl', function($rootScope, $scope, $routeParams, $location, mopidyservice, util, cacheservice) {
	$rootScope.pageTitle = "Browse";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = true;
	$scope.showContext = false;
	$scope.pageReady = false;
	$scope.showPage = 'home';
	
	var currentDir = { name: null, uri: null };
	$scope.libTlList = []
	
	if ($routeParams.uri){
		currentDir = { name: util.urlDecode($routeParams.name), uri: util.urlDecode($routeParams.uri) };
		console.log(currentDir.uri);
		if (currentDir.uri === 'favourites'){
			$scope.showPage = 'favs';
		} else {
			$scope.showPage = 'list';
		}
	} 
	
	if ($scope.showPage != 'favs'){	
		mopidyservice.getLibraryItems(currentDir.uri).then(function(data) {
			cacheservice.cacheBrowse(currentDir.uri, data); 
			$scope.libList = data;
			// Check for tracks and prepare tracklist
		  if (data[0].type === 'track' || data[data.length-1].type === 'track'){
				for (var i in data){
					if (data[i].type === 'track'){
						$scope.libTlList.push(data[i].uri)
					}
				}
			}	
			// Extra content for "home" menu
			if ($scope.showPage === 'home'){
				$rootScope.pageTitle = "My Music";
				for (var i in $scope.libList){
					var folder = $scope.libList[i].name
					if (folder === "Local media"){
							$scope.libList[i].icon = "fa fa-home fa-2x";
					} else if (folder === "Spotify"){
							var spot = i;
					} else if (folder === "Spotify Browse"){
							$scope.libList[i].icon = "fa fa-spotify fa-2x";
					} else if (folder === "TuneIn"){
							$scope.libList[i].icon = "fa fa-rss fa-2x"
					}
				}
				// we remove spotify from home menu. Spotify Browse is much better for now.
				if (spot){ $scope.libList.splice(spot,1); }
				// recent items.
				$scope.recentList = []
				var recent = _.chain(cacheservice.getRecent())
						.sortBy('timestamp')
						.value()
				recent.reverse();
				console.log(recent);
				if (recent){
					for (var i in recent){
						if (recent[i].__model__ === "Album" || (recent[i].__model__ === "Ref" && recent[i].type === "album")){
							var obj = {
								line1: recent[i].name,
								line2: "Album (by " + recent[i].artists[0].name +")",
								uri: "#/album/"+recent[i].name+"/"+recent[i].uri,
								timestamp: recent[i].timestamp,
								lfmImage: recent[i].lfmImage,
								context: recent[i]
							}
						} else if (recent[i].__model__ === "Playlist" || (recent[i].__model__ === "Ref" && recent[i].type === "playlist")){
							var obj = {
								line1: recent[i].name.split('(by')[0],
								line2: "Playlist (by " + recent[i].name.split('(by')[1],
								uri: "#/playlists/"+recent[i].uri,
								timestamp: recent[i].timestamp,
								lfmImage: recent[i].lfmImage,
								context: recent[i]
							}
						} else if (recent[i].__model__ === "Artist" || (recent[i].__model__ === "Ref" && recent[i].type === "artist")){
							var obj = {
								line1: recent[i].name,
								line2: "Artist",
								uri: "#/artist/"+recent[i].name+"/"+recent[i].uri,
								timestamp: recent[i].timestamp,
								lfmImage: recent[i].lfmImage,
								context: recent[i]
							}
						}
						if(obj){
							$scope.recentList.push(obj);
						}					
					}
				}
			} 		
			$scope.pageReady=true;
		});
	} else {
		// Favourites list
		$rootScope.pageTitle = "Favourites";
		$scope.favList = []
		var favs = _.chain(cacheservice.getFavs())
				.sortBy('timestamp')
				.value()
		favs.reverse();
		if (favs){
			for (var i in favs){
				if (favs[i].__model__ === "Album" || (favs[i].__model__ === "Ref" && favs[i].type === "album")){
					var obj = {
						line1: favs[i].name,
						line2: "Album (by " + favs[i].artists[0].name +")",
						uri: "#/album/"+favs[i].name+"/"+favs[i].uri,
						timestamp: favs[i].timestamp,
						lfmImage: favs[i].lfmImage,
						context: favs[i]
					}
				} else if (favs[i].__model__ === "Playlist" || (favs[i].__model__ === "Ref" && favs[i].type === "playlist")){
					var obj = {
						line1: favs[i].name.split('(by')[0],
						line2: "Playlist (by " + favs[i].name.split('(by')[1],
						uri: "#/playlists/"+favs[i].uri,
						timestamp: favs[i].timestamp,
						lfmImage: favs[i].lfmImage,
						context: favs[i]
					}
				} else if (favs[i].__model__ === "Artist" || (favs[i].__model__ === "Ref" && favs[i].type === "artist")){
					var obj = {
						line1: favs[i].name,
						line2: "Artist",
						uri: "#/artist/"+favs[i].name+"/"+favs[i].uri,
						timestamp: favs[i].timestamp,
						lfmImage: favs[i].lfmImage,
						context: favs[i]
					}
				} else if (favs[i].__model__ === "Track" || (favs[i].__model__ === "Ref" && favs[i].type === "track")){
					var obj = {
						line1: favs[i].name,
						line2: "Stream",
						uri: "#/browse/favourites", // this is a problem
						timestamp: favs[i].timestamp,
						lfmImage: favs[i].lfmImage,
						context: favs[i]
					}
					if (favs[i].artists) { obj.line2 = "Track by " + favs[i].artists[0].name };
				}
				if(obj){
					$scope.favList.push(obj);
				}					
			}
		}			
		$scope.pageReady=true;	
	}
	// url handling
	$scope.getUrl = function(type, uri, name){
		uri = util.urlEncode(uri);
		name = util.urlEncode(name);
		if (type === 'artist'){
			$location.path('/artist/'+name+'/'+uri+'/');
		} else if (type === 'album'){
			$location.path('/album/'+name+'/'+uri+'/');
		} else if (type === 'playlist'){
			$location.path('/playlists/'+uri+'/');
		} else {
			$location.path('/browse/'+uri+'/');
		}
	}
	
});