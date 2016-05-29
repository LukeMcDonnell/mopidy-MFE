****************
Mopidy-MFE
****************

Mopidy-MFE is a `Mopidy <http://www.mopidy.com/>`_ web extension.


Installation
============

Install by running::

    sudo pip install Mopidy-MFE

Upgrade by running::

    sudo pip install Mopidy-MFE --upgrade

Project resources
=================

- `Source code <https://github.com/LukeMcDonnell/mopidy-MFE>`_
- `Issue tracker <https://github.com/LukeMcDonnell/mopidy-MFE/issues>`_


Changelog
=========
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

