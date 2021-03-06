****************
Mopidy-MFE
****************

Mopidy-MFE is a `Mopidy <http://www.mopidy.com/>`_ web extension.


Installation
============

Install by running::

    pip install Mopidy-MFE

Upgrade by running::

    pip install Mopidy-MFE --upgrade

Project resources
=================

- `Source code <https://github.com/LukeMcDonnell/mopidy-MFE>`_
- `Issue tracker <https://github.com/LukeMcDonnell/mopidy-MFE/issues>`_


Changelog
=========
v0.4.9 (2016-06-12)
------------------
- Fixed track sorting bug when adding albums from context menu.
- Added context menu icons.


v0.4.8 (2016-06-12)
------------------
- Fixed Bug in caching service that would throw an error under certain conditions.
- Fixed css error causing slow loading of backgrounds.
- Fixed bug in sorting of album tracks.

v0.4.6 (2016-06-12)
------------------
- Fixed bug causing now playing to become unresponsive.
- Improved performance of slide-in menus.

v0.4.5 (2016-06-12)
------------------
- Tracks in album now sort by disc #, then track #.
- fixed bug in wide mode where page elements wouldn't align correctly.
- Workaround fix for slow loading background images.
- Album and artist images now loaded using mopidy's get_image function, as well as last fm.
- Added lazy loading for images in playlists and queue.
- Play Queue now automatically scrolls to currently playing track.
- Improved cache performance.
 
v0.4.4 (2016-06-06)
------------------
- Added favicon and icon support for ios and Android mobile web app compatibility.
 
v0.4.3 (2016-06-05)
------------------
- Added volume and seek controls to Now Playing.
- Added layout support in Now Playing for landscape oriented devices.
- Play Queue & Main Menu becomes permanent on large screens.

v0.4.2 (2016-06-04)
------------------
- Updated Now Playing screen. 
- Added repeat and random functionality to now playing.
- Improved speed when loading context menu links from queue.
- Improved slide-in menu and queue performance.
- Fixed slow loading of list pages.


v0.4.1 (2016-06-01)
------------------
- Play Queue is now a slide in menu, accessible from the header.
- Fixed bug where album page would fail to load when no albums present.
- Fixed bug where clearing cache would cause last-fm service to fail.
- Fixed bug where page would auto scroll to position of previous page when loading content from cache.
- Scroll position is now remembered individual browsing pages.
- Various Cosmetic adjustments and enhancements.

v0.4.0 (2016-05-30)
------------------
- Major UI improvements.
- Added queueing options and context menu for artist, album and playlist pages.
- Fixed search to be compatible with latest mopidy and mopidy-spotify updates.
- Stability improvements and bug fixes

v0.3.1 (2016-01-09)
------------------
- Added stream support to favourites list
- Forced local artists/albums into search results
- Refinements to how results are displayed
- Filtering by backend for search results

v0.3.0 (2016-01-07)
------------------
- Filter Favourites by artists/albums/tracks/playlists
- Added ability to clear search history
- Refined context menus
- Basic playlist control (currently only able to remove tracks, more functionality to come...)
- Reduced cache limits. This should prevent maxing out the browser localstorage limit.


v0.2.2 (2015-11-09)
-------------------
- Added ability to remove items from "favourites" list
- Implemented image cache to reduce lastfm api hits
- Removed mopidy dependency from pypi package
- Various bug fixes


v0.2.1 (2015-11-06)
-------------------
- Added "Favourites" functionality
- Fixed bug preventing "Recently Played" items persisting between sessions.


v0.2.0 (2015-11-05)
-------------------
- Added "My Music" section
- Recently Played items in "My Music"
- Fixed many layout and design errors
- Now Playing/Artists/Albums pages all show dynamic backgrounds based on content.
- Added context menus to provide further queueing options
- Various bug fixes/optimizations

v0.1.2 (2015-10-31)
-------------------
- Initial release.

