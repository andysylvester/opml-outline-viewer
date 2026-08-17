//no-jQuery version -- readHttpFile uses fetch, startup writes the outline with
//innerHTML, and the handful of utilities that used to come from scripting.com's
//basic code.js are defined at the bottom of this file, because basic code.js
//can't be loaded without jQuery.

function collapseEverything (theOutline, belowLevel) {
	function doCollapse (theNode, level) {
		if (theNode.subs !== undefined) {
			theNode.collapse = getBoolean (level > belowLevel);
			theNode.subs.forEach (function (sub) {
				doCollapse (sub, level + 1);
				});
			}
		}
	doCollapse (theOutline.opml.body, 0);
	}
function boldTopLevel (theOutline) {
	const theBody = theOutline.opml.body;
	if (theBody.subs !== undefined) {
		for (var i = 0; i < theBody.subs.length; i++) {
			theBody.subs [i].text = "<span class=\"spLevel1Head\">" + theBody.subs [i].text + "</span>";
			}
		}
	}
function readHttpFile (url, callback, timeoutInMilliseconds) { //5/27/14 by DW
	if (timeoutInMilliseconds === undefined) {
		timeoutInMilliseconds = 30000;
		}
	var theController = new AbortController ();
	var idTimer = window.setTimeout (function () {
		theController.abort ();
		}, timeoutInMilliseconds);
	fetch (url, {signal: theController.signal})
	.then (function (theResponse) {
		if (!theResponse.ok) {
			throw new Error (theResponse.status + " " + theResponse.statusText);
			}
		return (theResponse.text ());
		})
	.then (function (data) {
		window.clearTimeout (idTimer);
		callback (data);
		})
	.catch (function (err) {
		window.clearTimeout (idTimer);
		console.log ("readHttpFile: url == " + url + ", error == " + jsonStringify (err.message));
		callback (undefined);
		});
	}
const viewerConfig = {
	defaultOutline: "Activism_Links.opml", //what to show when there's no ?opml= in the url
	flAllowRemoteOutlines: false //see getOutlineName below before turning this on
	};

function getOutlineName () { //which outline to display -- index.html?opml=name.opml
	function isLocalName (theName) {
		//An outline's text is rendered as html, so whoever writes the outline can
		//put script on this page. That's fine for files we ship, but it means a
		//url like ?opml=https://example.com/x.opml would let a stranger run code
		//on this origin. So by default we only accept names in this folder.
		if ((theName.indexOf ("\\") != -1) || (theName.charAt (0) == "/")) {
			return (false); //site root, or a windows path
			}
		if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test (theName)) {
			return (false); //http:, data:, javascript: ...
			}
		var splits = theName.split ("/");
		for (var i = 0; i < splits.length; i++) {
			if (splits [i] == "..") {
				return (false); //no climbing out of the folder
				}
			}
		return (true);
		}
	var theName = new URLSearchParams (window.location.search).get ("opml");
	if ((theName === null) || (theName.length == 0)) {
		return (viewerConfig.defaultOutline);
		}
	if ((!viewerConfig.flAllowRemoteOutlines) && (!isLocalName (theName))) {
		console.log ("getOutlineName: \"" + theName + "\" isn't in this folder, using " + viewerConfig.defaultOutline + " instead. See flAllowRemoteOutlines in code.js.");
		return (viewerConfig.defaultOutline);
		}
	return (theName);
	}
function getOutlineTitle (theOutline, nameOutline) { //<head><title>, else the filename
	var theTitle = theOutline.opml.head.title;
	if ((theTitle === undefined) || (theTitle.length == 0)) {
		theTitle = nameOutline.split ("/").pop ();
		}
	theTitle = theTitle.replace (/\.opml$/i, ""); //drummer titles outlines with the filename
	return (theTitle.replace (/_/g, " ")); //Activism_Links reads better as Activism Links
	}
function displayOutlineError (nameOutline) {
	var theDisplayer = document.getElementById ("idOutlineDisplayer");
	theDisplayer.textContent = "Can't read the outline “" + nameOutline + ".”";
	console.log ("startup: couldn't read " + nameOutline);
	}
function startup () {
	console.log ("startup");
	var nameOutline = getOutlineName ();
	readHttpFile (nameOutline, function (opmltext) {
		if (opmltext === undefined) { //couldn't read it -- wrong name, or offline
			displayOutlineError (nameOutline);
			return;
			}
		var theOutline = opml.parse (opmltext);
		// collapseEverything (theOutline, 0);
		boldTopLevel (theOutline);

		var urlPermalink = window.location.href;
		var permalinkString = "#";

		var theTitle = getOutlineTitle (theOutline, nameOutline);
		document.getElementById ("idOutlineDisplayer").innerHTML = renderOutlineBrowser (theOutline.opml.body, false, urlPermalink, permalinkString, true);
		document.getElementById ("idOutlineTitle").textContent = theTitle;
		document.title = theTitle;

		//expansion state is per-outline, because the wedge numbers a state string
		//refers to only mean something for the outline it was saved from
		var nameState = "expandCollapseState." + nameOutline;
		var savedState = localStorage.getItem (nameState);
		if (savedState !== null) {
			applyExpansionState (savedState)
			}
		outlineBrowserData.expandCollapseCallback = function (idnum) {
			localStorage.setItem (nameState, getExpansionState ());
			}
		// hitCounter ();
		});
	}

//utilities that used to come from scripting.com's basic code.js --
//they're only defined if some other script hasn't already defined them.

if (typeof getBoolean === "undefined") {
	window.getBoolean = function (val) { //12/5/13 by DW
		switch (typeof (val)) {
			case "string":
				if (val == "1") { //1/28/20 by DW
					return (true);
					}
				if (val.toLowerCase () == "true") {
					return (true);
					}
				break;
			case "boolean":
				return (val);
			case "number":
				if (val == 1) {
					return (true);
					}
				break;
			}
		return (false);
		};
	}
if (typeof jsonStringify === "undefined") {
	window.jsonStringify = function (jstruct, flFixBreakage) { //7/30/14 by DW
		if (flFixBreakage === undefined) {
			flFixBreakage = false;
			}
		var s = JSON.stringify (jstruct, undefined, 4);
		if (flFixBreakage) {
			s = s.replace (new RegExp (String.fromCharCode (8232), "g"), "\\u2028").replace (new RegExp (String.fromCharCode (8233), "g"), "\\u2029");
			}
		return (s);
		};
	}
if (typeof endsWith === "undefined") {
	window.endsWith = function (s, possibleEnding, flUnicase) {
		if ((s === undefined) || (s.length == 0)) {
			return (false);
			}
		if (flUnicase === undefined) {
			flUnicase = true;
			}
		var ixstring = s.length - 1;
		for (var i = possibleEnding.length - 1; i >= 0; i--) {
			var chstring = s [ixstring--], chending = possibleEnding [i];
			if (flUnicase) {
				chstring = chstring.toLowerCase ();
				chending = chending.toLowerCase ();
				}
			if (chstring != chending) {
				return (false);
				}
			}
		return (true);
		};
	}
if (typeof hitCounter === "undefined") {
	window.hitCounter = function (counterGroup, counterServer, thisPageUrl, referrer) { //12/17/19 by DW
		var defaultCounterGroup = "scripting";
		var defaultCounterServer = "//counters.scripting.com/hello"; //2/2/23 by DW
		if (counterGroup === undefined) {
			counterGroup = defaultCounterGroup;
			}
		if (counterServer === undefined) {
			counterServer = defaultCounterServer;
			}
		if (thisPageUrl === undefined) {
			thisPageUrl = location.href;
			if (thisPageUrl === undefined) {
				thisPageUrl = "";
				}
			}
		if (endsWith (thisPageUrl, "#")) {
			thisPageUrl = thisPageUrl.substr (0, thisPageUrl.length - 1);
			}
		if (referrer === undefined) { //3/8/17 by DW -- the usual thing
			referrer = document.referrer;
			}
		var url = counterServer + "?group=" + encodeURIComponent (counterGroup) + "&referer=" + encodeURIComponent (referrer) + "&url=" + encodeURIComponent (thisPageUrl);
		readHttpFile (url, function (msgFromServer) {
			console.log ("hitCounter: msgFromServer == " + msgFromServer);
			});
		};
	}
