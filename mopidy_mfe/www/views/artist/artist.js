'use strict';

angular.module('mopidyFE.artist', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/artist/:id/:uri', {
		templateUrl: 'views/artist/artist.html',
		controller: 'artistCtrl'
	});
}])

.controller('artistCtrl', function($rootScope, $scope, $routeParams, mopidyservice, lastfmservice, cacheservice, util, $timeout) {
	$rootScope.pageTitle = "Artist";
	$rootScope.showFooter = true;
	$rootScope.showHeaderBG = false;
	$scope.showContext = false;
	$scope.pageReady = false;
	$timeout(function(){$scope.showBlurBG = true; $scope.$apply();}, 500);
	
	var artistName = util.urlDecode($routeParams.id);
	var uri = util.urlDecode($routeParams.uri);
	$scope.artistName = artistName;
	
	if (artistName){
		$rootScope.pageTitle = artistName;
		$scope.artistSummary = '';
		$scope.albums = [];
		$scope.albumss = 0;
		$scope.singles = 0;
		$scope.appearson = 0;
		$scope.artistImage = 'assets/vinyl-icon.png';
		$scope.playlistUris = [];
		$scope.backend = uri.split(":")[0]
		
		// Create Artist model
		$scope.artist = {
					__model__: 'Artist',
					name: artistName,
					uri: uri,
					lfmImage: 'assets/vinyl-icon.png'
		}
		
		// lastFM Data
		
		var j=[{	model: $scope.artist, 
							ref : {size: 'large', id: 0, callback: function(err, albumImageUrl, id) {
								if (!err && albumImageUrl !== undefined && albumImageUrl !== '') {
									$scope.artistImage = albumImageUrl;
									$scope.artist.lfmImage = albumImageUrl;
								}
								$scope.bgReady = true;
								}}
		}];			
		lastfmservice.getAlbumImages(j);
		
		// Mopidy Data
		mopidyservice.getItem(uri).then(function(data) {
			cacheservice.cacheItem(uri, data);
			var n = []; var a = 0; var allAlbums = []
			for (var i in data){
				var t = data[i]; var p = false;
				for (var j in n){
					if (t.album.uri === n[j]){
						allAlbums[j].tracks.push(t.uri); a++; p=true; break;
					}
				}
				if (!p){
					allAlbums.push({album: t.album, tracks: [t.uri]}); n.push(t.album.uri); a ++;
				}
			}
			 
			$scope.albums = allAlbums;
			
			var j = [];
			for (var i in $scope.albums) {
				// Attempt to fill in missing artist info.				
				if (!$scope.albums[i].album.artists){
					$scope.albums[i].album.artists = [$scope.artist];
				};				
				
				$scope.albums[i].album.lfmImage = 'assets/vinyl-icon.png';
				j.push({ 	model: $scope.albums[i].album, 
									ref : {size: 'medium', id: i, callback: function(err, albumImageUrl, id) {
										if (!err && albumImageUrl !== undefined && albumImageUrl !== '') {
											$scope.albums[id].album.lfmImage = albumImageUrl;
										}
										$scope.bgReady = true;	
									}}
				});
				
				
				// Add uris to playlist
				for (var n in $scope.albums[i].tracks){
					$scope.playlistUris.push($scope.albums[i].tracks[n]);
				}
				
				// assign album type
				if ($scope.albums[i].album.artists[0].uri === uri) {
					if ($scope.albums[i].tracks.length > 3) {
						$scope.albums[i].type = 'album';
						$scope.albumss ++;
					} else {
						$scope.albums[i].type = 'single';
						$scope.singles ++;
					}
				} else {
					$scope.albums[i].type = 'appearson'; 
					$scope.appearson ++;
				}
			}
			lastfmservice.getAlbumImages(j)
			$scope.pageReady=true;
		})
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
			$("#launchMenu").css({'width': 'calc(100% - 300px)'});
			$("#background").css({'width': 'calc(100% - 300px)'});
			$("#info").css({'width': 'calc(100% - 300px)'});
		} else {
			$("#launchMenu").css({'width': '100%'});
			$("#background").css({'width': '100%'});
			$("#info").css({'width': '100%'});
		}
	}
	$scope.$on('widescreenChanged', function(event, data) {
		resize();
	})
	resize();
	
});