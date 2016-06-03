angular.module('mopidyFE.mopidy', [])
  .factory('mopidyservice', function($q, $rootScope, cacheservice) {

    var consoleLog = console.log.bind(console);
    var consoleError = console.error.bind(console);

    // Wraps calls to mopidy api and converts mopidy's promise to Angular $q promise.
    // Mopidy method calls are passed as a string because some methods are not
    // available yet when this method is called, due to the introspection.
    // See also http://blog.mbfisher.com/2013/06/mopidy-websockets-and-introspective-apis.html
    function wrapMopidyFunc(functionNameToWrap, thisObj) {
      return function() {
        var deferred = $q.defer();
        var args = Array.prototype.slice.call(arguments);
        var self = thisObj || this;

        $rootScope.$broadcast('mopidyFE:mopidycalling', { name: functionNameToWrap, args: args });

        if (self.isConnected) {
          executeFunctionByName(functionNameToWrap, self, args).then(function(data) {
            deferred.resolve(data);
            $rootScope.$broadcast('mopidyFE:mopidycalled', { name: functionNameToWrap, args: args });
          }, function(err) {
            deferred.reject(err);
            $rootScope.$broadcast('mopidyFE:mopidyerror', { name: functionNameToWrap, args: args, err: err });
          });
        }
        else
        {
          self.mopidy.on("state:online", function() {
            executeFunctionByName(functionNameToWrap, self, args).then(function(data) {
              deferred.resolve(data);
              $rootScope.$broadcast('mopidyFE:mopidycalled', { name: functionNameToWrap, args: args });
            }, function(err) {
              deferred.reject(err);
              $rootScope.$broadcast('mopidyFE:mopidyerror', { name: functionNameToWrap, args: args, err: err });
            });
          });
        }
        return deferred.promise;
      };
    }

    function executeFunctionByName(functionName, context, args) {
      var namespaces = functionName.split(".");
      var func = namespaces.pop();
      for(var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
      }
      return context[func].apply(context, args);
    }

    return {
      mopidy: {},
      isConnected: false,
      currentTlTracks: [],
      start: function() {
      	
        var self = this;        
        $rootScope.$broadcast('mopidyFE:mopidystarting');
        
        this.mopidy = new Mopidy({
        	webSocketUrl: 'ws://'+ window.localStorage.ip +':'+ window.localStorage.port +'/mopidy/ws/',
          callingConvention: 'by-position-or-by-name'
        });
        
        this.mopidy.on(consoleLog);
        
        // Convert Mopidy events to Angular events
        this.mopidy.on(function(ev, args) {
          $rootScope.$broadcast('mopidy:' + ev, args);
          if (ev === 'state:online') {
            self.isConnected = true;
          }
          if (ev === 'state:offline') {
            self.isConnected = false;
          }
        });
				
				
        $rootScope.$broadcast('mopidyFE:mopidystarted');
      },
      stop: function() {
        $rootScope.$broadcast('mopidyFE:mopidystopping');
        this.mopidy.close();
        this.mopidy.off();
        this.mopidy = null;
        $rootScope.$broadcast('mopidyFE:mopidystopped');
      },
      restart: function() {
        this.stop();
        this.start();
      },
      
      //
      // Library/playlist/search Data request method
      //
      getPlaylists: function() {
        return wrapMopidyFunc("mopidy.playlists.asList", this)();
      },
      getPlaylist: function(uri) {
        return wrapMopidyFunc("mopidy.playlists.lookup", this)({ uri: uri });
      },
      getLibraryItems: function(uri) {
      	var c = cacheservice.getBrowseCache(uri)
      	if (c.found){
      		return c.data
      	}
        return wrapMopidyFunc("mopidy.library.browse", this)({ uri: uri });
      },
      getItem: function(uri) {
      	var c = cacheservice.getItemCache(uri)
      	if (c.found){
      		return c.data
      	}
        return wrapMopidyFunc("mopidy.library.lookup", this)({ uri: uri });
      },
      search: function(query) {
      	var c = cacheservice.getSearchCache(query)
      	if (c.found){
      		return c.data
      	}
      	return wrapMopidyFunc("mopidy.library.search", this)({ any : [ query ] });
      },
      //
      // library refresh... not even sure what this does right now.
      //
      refresh: function(uri) {
        return wrapMopidyFunc("mopidy.library.refresh", this)({ uri: uri });
      },
      //
      // Now Playing Data Requests (non cacheable)
      //
      getCurrentTrack: function() {
        return wrapMopidyFunc("mopidy.playback.getCurrentTrack", this)();
      },
      getCurrentTlTrack: function() {
        return wrapMopidyFunc("mopidy.playback.getCurrentTlTrack", this)();
      },
      getTimePosition: function() {
        return wrapMopidyFunc("mopidy.playback.getTimePosition", this)();
      },
      getVolume: function() {
        return wrapMopidyFunc("mopidy.mixer.getVolume", this)();
      },
      getState: function() {
        return wrapMopidyFunc("mopidy.playback.getState", this)();
      },
      getRandom: function () {
        return wrapMopidyFunc("mopidy.tracklist.getRandom", this)();
      },
      getRepeat: function () {
        return wrapMopidyFunc("mopidy.tracklist.getRepeat", this)();
      },
      getCurrentTrackList: function () {
        return wrapMopidyFunc("mopidy.tracklist.getTlTracks", this)();
      },
      //
      // Play/tracklist Controls
      //      
      seek: function(timePosition) {
        return wrapMopidyFunc("mopidy.playback.seek", this)({ time_position: timePosition });
      },
      setVolume: function(volume) {
        return wrapMopidyFunc("mopidy.mixer.setVolume", this)({ volume: volume });
      },
      play: function() {
        return wrapMopidyFunc("mopidy.playback.play", this)();
      },
      pause: function() {
        return wrapMopidyFunc("mopidy.playback.pause", this)();
      },
      stopPlayback: function(clearCurrentTrack) {
        return wrapMopidyFunc("mopidy.playback.stop", this)();
      },
      previous: function() {
        return wrapMopidyFunc("mopidy.playback.previous", this)();
      },
      next: function() {
        return wrapMopidyFunc("mopidy.playback.next", this)();
      },
      setRandom: function (set) {
        return wrapMopidyFunc("mopidy.tracklist.setRandom", this)([ set ]);
      },
      setRepeat: function (set) {
        return wrapMopidyFunc("mopidy.tracklist.setRepeat", this)([ set ]);
      },
      //
      // Queueing controls
      //
      playTlTrack: function(track){
      	var self = this;
      	self.mopidy.playback.play({"tlid":track})
      },
      
      addReplacePlay: function (track, surroundingTracks) {
      	var self = this;
      	
      	self.mopidy.playback.stop()
          .then(function() {
            self.mopidy.tracklist.clear();
          }, consoleError)
          .then(function() {
          	//console.log("add tl");
            self.mopidy.tracklist.add({ uris: surroundingTracks });
          }, consoleError)
          .then(function() {
            self.mopidy.tracklist.getTlTracks()
              .then(function(tlTracks) {
                self.currentTlTracks = tlTracks;
                var tlTrackToPlay = _.find(tlTracks, function(tlTrack) {
                  return tlTrack.track.uri === track.uri;
                });
                self.mopidy.playback.play({ tl_track: tlTrackToPlay });
              }, consoleError);
          } , consoleError);
      	
    	},
    	
    	appendTrack: function(track){
    		var self=this;
    		self.mopidy.tracklist.add({ uris: track })
    	},
    	
    	addTrackNext: function(track, pos){
    		var self=this;
    		self.mopidy.tracklist.index()
    			.then(function(pos){
 			  		self.mopidy.tracklist.add({uris: track, at_position: pos+1})
 			  	})
 			  	
    	},
    	playTrackNext: function(track){
    		var self=this;
    		self.mopidy.tracklist.index()
    			.then(function(pos){
 			  		self.mopidy.tracklist.add({uris: track, at_position: pos+1})
 			  			.then(function(){
 			  				self.next();
 			  			})
 			  	})
 			  		
    	},
    	
      playTrack: function(track, surroundingTracks) {
        var self = this;

        // Check if a playlist change is required. If not just change the track.
        if (self.currentTlTracks.length > 0) {
          var trackUris = _.pluck(surroundingTracks, 'uri');
          var currentTrackUris = _.map(self.currentTlTracks, function(tlTrack) {
            return tlTrack.track.uri;
          });
          if (_.difference(trackUris, currentTrackUris).length === 0) {
            // no playlist change required, just play a different track.
            self.mopidy.playback.stop()
              .then(function () {
                var tlTrackToPlay = _.find(self.currentTlTracks, function(tlTrack) {
                  return tlTrack.track.uri === track.uri;
                });
                self.mopidy.playback.play({ tl_track: tlTrackToPlay });
              });
            return;
          }
        }

        self.mopidy.playback.stop()
          .then(function() {
            self.mopidy.tracklist.clear();
          }, consoleError)
          .then(function() {
          	//console.log("add tl");
            self.mopidy.tracklist.add({ tracks: surroundingTracks });
          }, consoleError)
          .then(function() {
            self.mopidy.tracklist.getTlTracks()
              .then(function(tlTracks) {
                self.currentTlTracks = tlTracks;
                var tlTrackToPlay = _.find(tlTracks, function(tlTrack) {
                  return tlTrack.track.uri === track.uri;
                });
                self.mopidy.playback.play({ tl_track: tlTrackToPlay });
              }, consoleError);
          } , consoleError);
      },
      playStream: function(streamUri) {
        var self = this;

        self.stopPlayback(true)
          .then(function() {
            self.mopidy.tracklist.clear();
          }, consoleError)
          .then(function() {
            self.mopidy.tracklist.add({ at_position: 0, uri: streamUri });
          }, consoleError)
          .then(function() {
            self.mopidy.playback.play();
          }, consoleError);
      },
			// Queue ctrl
      queueRemove: function(data){
      	return wrapMopidyFunc("mopidy.tracklist.remove", this)({ tlid: data });
      },
     	queueMoveUp: function(){
     		
     	},
     	queueMoveDown: function(){
     		
     	}
      
      
    };
  });
