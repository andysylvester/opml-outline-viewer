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
function startup () {
	console.log ("startup");
	readHttpFile ("Activism_Links.opml", function (opmltext) {
		var theOutline = opml.parse (opmltext);
		// collapseEverything (theOutline, 0);
		boldTopLevel (theOutline);

		var urlPermalink = window.location.href;
		var permalinkString = "#";

		console.log (JSON.stringify(theOutline.opml.body, undefined, 4));

		document.getElementById ("idOutlineDisplayer").innerHTML = renderOutlineBrowser (theOutline.opml.body, false, urlPermalink, permalinkString, true);
		document.getElementById ("idOutlineTitle").innerHTML = "Activism Links";

		if (localStorage.expandCollapseState !== undefined) {
			applyExpansionState (localStorage.expandCollapseState)
			}
		outlineBrowserData.expandCollapseCallback = function (idnum) {
			localStorage.expandCollapseState = getExpansionState ();
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
