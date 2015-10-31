angular.module('mopidyFE.playlist', [])
.factory('plservice', function(mopidyservice, cacheservice) {
	
	
	
	
	return {
		addReplacePlay: function (track, uris){
			mopidyservice.addReplacePlay(track, uris);			
		}
				
		
		
		
		
		
	}
	
})