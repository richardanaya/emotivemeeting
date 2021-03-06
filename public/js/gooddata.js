/* Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved. */
/* gooddata - v0.0.13 */
/* 2014-09-14 10:56:06 */
/* Latest git commit: "440b8d1" */

(function(window, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser Global (gooddata is out global library identifier)
    window.gooddata = factory();
  }
}(this, function() {
// Tilde.io's loader shim
// taken from
// https://raw2.github.com/tildeio/rsvp.js/master/vendor/loader.js
var define, require;

(function() {
  
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  require = function(name) {

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(require(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };

  require.entries = registry;
})();

define("loader", function(){});

// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
define('_jquery',[],function() { 
    if (typeof $ === 'undefined') {
        throw new Error('You need to include jQuery to use Gooddata JS');
    }

    return window.$;
});


// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('config',[
], function(
) {
    
    /**
     * Config module holds SDK configuration variables
     *
     * Currently its only custom domain - which enabled using
     * sdk from different domain (using CORS)
     *
     * Never set properties directly - always use setter methods
     *
     * @module config
     * @class config
     */

    var module = { domain: undefined },
        r = '(?:(https)://+|(www\\.)?)\\w[:;,\\.?\\[\\]\\w/~%&=+#-@!]*';

    /**
     * Sets custom domain. Parameter is url which has always to be https://
     * (if you don't provide it, we will do it for you).
     *
     * RegExp inspired taken from
     * https://github.com/jarib/google-closure-library/blob/master/closure/goog/string/linkify.js
     *
     * @method setCustomDomain
     */
    var setCustomDomain = function(d) {
        var link = d.match(r);

        if (!link) {
            throw new Error(d + ' is not a valid url');
        }

        // ensure https:// prefix
        // and strip possible trailing /
        module.domain = 'https://' + link[0]
                        .replace(/^https:\/\//, '')
                        .replace(/\/$/, '');
    };

    module.setCustomDomain = setCustomDomain;

    return module;
});



// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
define('xhr',['_jquery', 'config'], function($, config) { 

    /**
     * Ajax wrapper around GDC authentication mechanisms, SST and TT token handling and polling.
     * Inteface is same as original jQuery.ajax.

     * If token is expired, current request is "paused", token is refreshed and request is retried and result.
     * is transparently returned to original call.

     * Additionally polling is handled. Only final result of polling returned.
     * @module xhr
     * @class xhr
     */

    var tokenRequest,
        xhrSettings,
        xhr = {}; // returned module

    xhr.enrichSettingWithCustomDomain = function(settings, domain) {
        if (domain) {
            // protect url to be prepended with domain on retry
            if (settings.url.indexOf(domain) === -1) {
                settings.url = domain + settings.url;
            }
            settings.xhrFields = settings.xhrFields || {};
            settings.xhrFields.withCredentials = true;
        }

        return settings;
    };

    var retryAjaxRequest = function(req, deferred) {
        // still use our extended ajax, because is still possible to fail recoverably in again
        // e.g. request -> 401 -> token renewal -> retry request -> 202 (polling) -> retry again after delay
        xhr.ajax(req).done(function(data, textStatus, xhr) {
            deferred.resolve(data, textStatus, xhr);
        }).fail(function(xhr, textStatus, err) {
            deferred.reject(xhr, textStatus, err);
        });
    };

    var continueAfterTokenRequest = function(req, deferred) {
        tokenRequest.done(function() {
            retryAjaxRequest(req, deferred);
        }).fail(function(xhr, textStatus, err) {
            if (xhr.status !== 401) {
                deferred.reject(xhr, textStatus, err);
            }
        });
    };

    var handleUnauthorized = function(req, deferred) {
        if (!tokenRequest) {
            // Create only single token request for any number of waiting request.
            // If token request exist, just listen for it's end.
            tokenRequest = $.ajax(xhr.enrichSettingWithCustomDomain({ url: '/gdc/account/token/' }, config.domain)).always(function() {
                tokenRequest = null;
            }).fail(function(xhr, textStatus, err) {
                //unauthorized when retrieving token -> not logged
                if ((xhr.status === 401) && ($.isFunction(req.unauthorized))) {
                    req.unauthorized(xhr);
                    return;
                }
                // unauthorized handler is not defined or not http 401
                deferred.reject(xhr, textStatus, err);
            });
        }
        continueAfterTokenRequest(req, deferred);
    };

    var handlePolling = function(req, deferred) {
        setTimeout(function() {
            retryAjaxRequest(req, deferred);
        }, req.pollDelay);
    };

    // helper to coverts traditional ajax callbacks to deferred
    var reattachCallbackOnDeferred = function(settings, property, defferAttach) {
        var callback = settings[property];
        delete settings[property];
        if ($.isFunction(callback)) {
            defferAttach(callback);
        }
        if ($.isArray(callback)) {
            callback.forEach(function(fn) {
                if ($.isFunction(callback)) {
                    defferAttach(fn);
                }
            });
        }
    };

    /**
     * additional ajax configuration specific for xhr module, keys
     *   unauthorized: function(xhr) - called when user is unathorized and token renewal failed
     *   pollDelay: int - polling interval in milisecodns, default 1000

     * method also accepts any option from original $.ajaxSetup. Options will be applied to all call of xhr.ajax().

     * xhrSetup behave similar tp $.ajaxSetup, each call replaces settings completely.
     * Options can be also passed to particular xhr.ajax calls (same as optios for $.ajax and $.ajaxSetup)
     * @method ajaxSetup
     */
    xhr.ajaxSetup = function(settings) {
        xhrSettings = $.extend({
            contentType: 'application/json',
            dataType: 'json',
            pollDelay: 1000
        }, settings);
    };

    /**
     * Same api as jQuery.ajax - arguments (url, settings) or (settings) with url inside
     * Additionally content type is automatically json, and object in settings.data is converted to string
     * to be consumed by GDC backend.

     * settings additionally accepts keys: unathorized, pollDelay  (see xhrSetup for more details)
     * @method ajax
     * @param url request url
     * @param settings settings object
     */
    xhr.ajax = function(url, settings) {
        if ($.isPlainObject(url)) {
            settings = url;
            url = undefined;
        }
        // copy settings to not modify passed object
        // settings can be undefined, doesn't matter, $.extend handle it
        settings = $.extend({}, xhrSettings, settings);
        if (url) {
            settings.url = url;
        }

        if ($.isPlainObject(settings.data)) {
            settings.data = JSON.stringify(settings.data);
        }

        var d = $.Deferred();
        reattachCallbackOnDeferred(settings, 'success', d.done);
        reattachCallbackOnDeferred(settings, 'error', d.fail);
        reattachCallbackOnDeferred(settings, 'complete', d.always);

        if (tokenRequest) {
            continueAfterTokenRequest(settings, d);
            return d;
        }

        $.ajax(xhr.enrichSettingWithCustomDomain(settings, config.domain)).fail(function(xhr, textStatus, err) {
            if (xhr.status === 401) {
                handleUnauthorized(settings, d);
            } else {
                d.reject(xhr, textStatus, err);
            }
        }).done(function(data, textStatus, xhr) {
            if (xhr.status === 202) {
                // if the response is 202 and Location header is not empty, let's poll on the new Location
                var location = xhr.getResponseHeader('Location');
                if (location){
                    settings.url = location;
                }
                handlePolling(settings, d);
            } else {
                d.resolve(data, textStatus, xhr);
            }
        });
        return d;
    };

    var xhrMethod = function xhrMethod(method) {
        return function(url, settings) {
            var opts = $.extend(true, {
                method: method
            }, settings);

            return xhr.ajax(url, opts);
        };
    };

    /**
     * Wrapper for xhr.ajax method GET
     * @method get
     */
    xhr.get = xhrMethod('GET');

    /**
     * Wrapper for xhr.ajax method POST
     * @method post
     */

    xhr.post = xhrMethod('POST');

    /**
     * Wrapper for xhr.ajax method PUT
     * @method put
     */
    xhr.put = xhrMethod('PUT');

    // setup default settings
    xhr.ajaxSetup({});
    return xhr;

});

// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('util',[],function() {
    

    /**
     * Utility methods. Mostly private
     *
     * @module util
     * @class util
     *
     */

    /**
     * Simple get path helper method
     *
     * @private
     * @method getPath
     * @param {Object} obj object to start getting path from
     * @param {String} path path identifier
     * @return object at given path
     */
    var getPath = function(obj, path) {
        var paths = path.split('.'),
            found = obj,
            i;

        for (i = 0; i < paths.length; ++i) {
            if (found[paths[i]] === undefined) {
                return undefined;
            } else {
                found = found[paths[i]];
            }
        }
        return found;
    };

    /**
     * Create getter function for accessing nested objects
     *
     * @param {String} path Target path to nested object
     * @method getIn
     * @private
     */
    var getIn = function(path) {
        return function(object) {
            return getPath(object, path);
        };
    };

    return {
        getPath: getPath,
        getIn: getIn
    };
});


// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('user',['xhr'], function(xhr) {
    

    /**
     * @module user
     * @class user
     */

    /**
     * Find out whether a user is logged in
     *
     * Returns a promise which either:
     * **resolves** - which means user is logged in or
     * **rejects** - meaning is not logged in
     * @method isLoggedIn
     */
    var isLoggedIn = function() {
        return $.getJSON('/gdc/account/token');
    };


    /**
     * This function provides an authentication entry point to the GD API. It is needed to authenticate
     * by calling this function prior any other API calls. After providing valid credentials
     * every subsequent API call in a current session will be authenticated.
     *
     * @method login
     * @param {String} username
     * @param {String} password
     */
    var login = function(username, password) {
        return xhr.post("/gdc/account/login", {
            data: JSON.stringify({
                postUserLogin: {
                    login: username,
                    password: password,
                    remember: 1,
                    captcha: "",
                    verifyCaptcha: ""
                }
            })
        });
    };

    /**
     * Logs out current user
     * @method logout
     */
    var logout = function() {
        var d = $.Deferred();

        isLoggedIn().then(function() {
            return xhr.get('/gdc/app/account/bootstrap').then(function(result) {
                var userUri = result.bootstrapResource.accountSetting.links.self;
                var userId = userUri.match(/([^\/]+)\/?$/)[1];

                return userId;
            }, d.reject);
        }, d.resolve).then(function(userId) {
            return xhr.ajax('/gdc/account/login/' + userId, {
                method: 'delete'
            });
        }).then(d.resolve, d.reject);

        return d.promise();
    };

    /**
     * Returns info about currently logged in user from bootstrap resource
     * @method getAccountInfo
     */
    var getAccountInfo = function() {
        var d = $.Deferred();

        xhr.get('/gdc/app/account/bootstrap').then(function(result) {
            var br = result.bootstrapResource;
            var accountInfo = {
                login: br.accountSetting.login,
                loginMD5: br.current.loginMD5,
                firstName: br.accountSetting.firstName,
                lastName: br.accountSetting.lastName,
                organizationName: br.settings.organizationName
            };

            d.resolve(accountInfo);
        }, d.reject);

        return d.promise();
    };


    return {
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout,
        getAccountInfo: getAccountInfo
    };
});

// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('metadata',['xhr', 'util'], function(xhr, util) {
    

    /**
     * Functions for working with metadata objects
     *
     * @class metadata
     * @module metadata
     */


    /**
     * Get additional information about elements specified by their uris
     * `elementUris` is the array of uris of elements to be look-up
     * Currently makes a request for each object, should be encapsulated
     * to one call
     *
     * @method getElementDetails
     * @param {Array} array of element uri strings
     * @private
     */
    var getElementDetails = function(elementUris) {
        var d = $.Deferred();

        var fns = elementUris.map(function(uri) {
            return xhr.ajax(uri);
        });

        $.when.apply(this, fns).done(function() {
            // arguments is the array of resolved
            var args = Array.prototype.slice.call(arguments);

            var enriched = args.map(function(element) {
                var root = element[0];
                if (root.attributeDisplayForm) {
                    return {
                        type: 'attribute',
                        uri: root.attributeDisplayForm.meta.uri,
                        formOf: root.attributeDisplayForm.content.formOf,
                        name: root.attributeDisplayForm.meta.title
                    };
                } else if (root.metric) {
                    return {
                        type: 'metric',
                        uri: root.metric.meta.uri,
                        name: root.metric.meta.title
                    };
                }
            });

            // override titles with related attribute title
            var uri2fn = {};
            var ids = {};

            var indi = [], i = 0;

            var fns = [];

            enriched.forEach(function(el, idx) {
                if (el.formOf) {
                    fns.push(xhr.ajax(el.formOf));
                    ids[el.uri] = idx;
                    indi[i++] = idx;
                }
            });

            // all formOf are executed
            $.when.apply(this, fns).done(function() {
                var args = Array.prototype.slice.call(arguments);

                args.forEach(function(arg, idx) {
                    // get element to owerwrite
                    var which = indi[idx];
                    var update = enriched[which];

                    update.name = arg[0].attribute.meta.title;
                });

                d.resolve(enriched);
            });

        });
        return d.promise();
    };

    /**
     * Reutrns all attributes in a project specified by projectId param
     *
     * @method getAttributes
     * @param projectId Project identifier
     * @return {Array} An array of attribute objects
     */
    var getAttributes = function(projectId) {
        return xhr.get('/gdc/md/' + projectId + '/query/attributes').then(util.getIn('query.entries'));
    };

    /**
     * Returns all dimensions in a project specified by projectId param
     *
     * @method getDimensions
     * @param projectId Project identifier
     * @return {Array} An array of dimension objects
     * @see getFolders
     */
    var getDimensions = function(projectId) {
        return xhr.get('/gdc/md/' + projectId + '/query/dimensions').then(util.getIn('query.entries'));
    };

    /**
     * Returns project folders. Folders can be of specific types and you can specify
     * the type you need by passing and optional `type` parameter
     *
     * @method getFolders
     * @param {String} projectId - Project identifier
     * @param {String} type - Optional, possible values are `metric`, `fact`, `attribute`
     * @return {Array} An array of dimension objects
     */
    var getFolders = function(projectId, type) {
        var _getFolders = function(projectId, type) {
            var typeURL = type ? '?type='+type : '';

            return xhr.get('/gdc/md/' + projectId + '/query/folders' + typeURL).then(util.getIn('query.entries'));
        };

        switch (type) {
            case 'fact':
            case 'metric':
                return _getFolders(projectId, type);
            case 'attribute':
                return getDimensions(projectId);
            default:
                var d = $.Deferred();
                $.when(_getFolders(projectId, 'fact'),
                       _getFolders(projectId, 'metric'),
                       getDimensions(projectId)).done(function(facts, metrics, attributes) {
                    d.resolve({fact: facts, metric: metrics, attribute: attributes});
                });
                return d.promise();
        }
    };

    /**
     * Get folders with items.
     * Returns array of folders, each having a title and items property which is an array of
     * corresponding items. Each item is either a metric or attribute, keeping its original
     * verbose structure.
     *
     * @method getFoldersWithItems
     * @param {String} type type of folders to return
     * @return {Array} Array of folder object, each containing title and
     * corresponding items.
     */
    var getFoldersWithItems = function(projectId, type) {
        var result = $.Deferred();

        // fetch all folders of given type and process them
        getFolders(projectId, type).then(function(folders) {

            // Helper function to get details for each metric in the given
            // array of links to the metadata objects representing the metrics.
            // @return the array of promises
            var getMetricItemsDetails = function(array) {
                var d = $.Deferred();
                $.when.apply(this, array.map(getObjectDetails)).then(function() {
                    var metrics = Array.prototype.slice.call(arguments).map(function(item) {
                        return item.metric;
                    });
                    d.resolve(metrics);
                }, d.reject);
                return d.promise();
            };

            // helper mapBy function
            var mapBy = function(array, key) {
                return array.map(function(item) {
                    return item[key];
                });
            };

            // helper for sorting folder tree structure
            // sadly @returns void (sorting == mutating array in js)
            var sortFolderTree = function(structure) {
                structure.forEach(function(folder) {
                    folder.items.sort(function(a, b) {
                        if(a.meta.title < b.meta.title) {
                            return -1;
                        } else if(a.meta.title > b.meta.title) {
                            return 1;
                        }

                        return 0;
                    });
                });
                structure.sort(function(a, b) {
                    if(a.title < b.title) {
                        return -1;
                    } else if(a.title > b.title) {
                        return 1;
                    }

                    return 0;
                });
            };

            var foldersLinks = mapBy(folders, 'link');
            var foldersTitles = mapBy(folders, 'title');

            // fetch details for each folder
            $.when.apply(this, foldersLinks.map(getObjectDetails)).then(function() {
                var folderDetails = Array.prototype.slice.call(arguments);

                // if attribute, just parse everything from what we've received
                // and resolve. For metrics, lookup again each metric to get its
                // identifier. If passing unsupported type, reject immediately.
                if (type === 'attribute') {
                    // get all attributes, subtract what we have and add rest in unsorted folder
                    getAttributes(projectId).then(function(attributes) {
                        // get uris of attributes which are in some dimension folders
                        var attributesInFolders = [];
                        folderDetails.forEach(function(fd) {
                            fd.dimension.content.attributes.forEach(function(attr) {
                                attributesInFolders.push(attr.meta.uri);
                            });
                        });
                        // unsortedUris now contains uris of all attributes which aren't in a folder
                        var unsortedUris =
                            attributes
                                .filter(function(item) { return attributesInFolders.indexOf(item.link) === -1; })
                                .map(function(item) { return item.link; });
                        // now get details of attributes in no folders
                        $.when.apply(this, unsortedUris.map(getObjectDetails)).then(function() {
                            // get unsorted attribute objects
                            var unsortedAttributes = Array.prototype.slice.call(arguments).map(function(attr) { return attr.attribute; });
                            // create structure of folders with attributes
                            var structure = folderDetails.map(function(folderDetail) {
                                return {
                                    title: folderDetail.dimension.meta.title,
                                    items: folderDetail.dimension.content.attributes
                                };
                            });
                            // and append "Unsorted" folder with attributes to the structure
                            structure.push({
                                title: "Unsorted",
                                items: unsortedAttributes
                            });
                            sortFolderTree(structure);
                            result.resolve(structure);
                        });
                    });
                } else if (type === 'metric') {
                    var entriesLinks = folderDetails.map(function(entry) {
                        return mapBy(entry.folder.content.entries, 'link');
                    });
                    // get all metrics, subtract what we have and add rest in unsorted folder
                    getMetrics(projectId).then(function(metrics) {
                        // get uris of metrics which are in some dimension folders
                        var metricsInFolders = [];
                        folderDetails.forEach(function(fd) {
                            fd.folder.content.entries.forEach(function(metric) {
                                metricsInFolders.push(metric.link);
                            });
                        });
                        // unsortedUris now contains uris of all metrics which aren't in a folder
                        var unsortedUris =
                            metrics
                                .filter(function(item) { return metricsInFolders.indexOf(item.link) === -1; })
                                .map(function(item) { return item.link; });

                        // sadly order of parameters of concat matters! (we want unsorted last)
                        entriesLinks.push(unsortedUris);

                        // now get details of all metrics
                        $.when.apply(this, entriesLinks.map(function(linkArray, idx) {
                            return getMetricItemsDetails(linkArray);
                        })).then(function() {
                            // all promises resolved, i.e. details for each metric are available
                            var tree = Array.prototype.slice.call(arguments);
                            var structure = tree.map(function(treeItems, idx) {
                                // if idx is not in foldes list than metric is in "Unsorted" folder
                                return {
                                    title: (foldersTitles[idx] || "Unsorted"),
                                    items: treeItems
                                };
                            });
                            sortFolderTree(structure);
                            result.resolve(structure);
                        }, result.reject);
                    });
                } else {
                    result.reject();
                }
            });
        }, result.reject);

        return result.promise();
    };

    /**
     * Returns all metrics in a project specified by the given projectId
     *
     * @method getMetrics
     * @param projectId Project identifier
     * @return {Array} An array of metric objects
     */
    var getMetrics = function(projectId) {
        return xhr.get('/gdc/md/' + projectId + '/query/metrics').then(util.getIn('query.entries'));
    };

    /**
     * Returns all metrics that are reachable (with respect to ldm of the project
     * specified by the given projectId) for given attributes
     *
     * @method getAvailableMetrics
     * @param {String} projectId - Project identifier
     * @param {Array} attrs - An array of attribute uris for which we want to get
     * availabale metrics
     * @return {Array} An array of reachable metrics for the given attrs
     * @see getAvailableAttributes
     */
    var getAvailableMetrics = function(projectId, attrs) {
        var d = $.Deferred();

        xhr.post('/gdc/md/'+ projectId +'/availablemetrics', {
            data: JSON.stringify(attrs)
        }).then(function(result) {
            d.resolve(result.entries);
        }, d.reject);

        return d.promise();
    };

    /**
     * Returns all attributes that are reachable (with respect to ldm of the project
     * specified by the given projectId) for given metrics (also called as drillCrossPath)
     *
     * @method getAvailableAttributes
     * @param {String} projectId - Project identifier
     * @param {Array} metrics - An array of metric uris for which we want to get
     * availabale attributes
     * @return {Array} An array of reachable attributes for the given metrics
     * @see getAvailableMetrics
     */
    var getAvailableAttributes = function(projectId, metrics) {
        var d = $.Deferred();

        xhr.post('/gdc/md/'+ projectId +'/drillcrosspaths', {
            data: JSON.stringify(metrics)
        }).then(function(result) {
            d.resolve(result.drillcrosspath.links);
        }, d.reject);

        return d.promise();
    };

    /**
     * Get details of a metadata object specified by its uri
     *
     * @method getObjectDetails
     * @param uri uri of the metadata object for which details are to be retrieved
     * @return {Object} object details
     */
    var getObjectDetails = function(uri) {
        var d = $.Deferred();

        xhr.get(uri, {
            headers: { Accept: 'application/json' },
            dataType: 'json',
            contentType: 'application/json'
        }).then(function(res) {
            d.resolve(res);
        }, d.reject);

        return d.promise();
    };

    /**
     * Get identifier of a metadata object identified by its uri
     *
     * @method getObjectIdentifier
     * @param uri uri of the metadata object for which the identifier is to be retrieved
     * @return {String} object identifier
     */
    var getObjectIdentifier = function(uri) {
        var obj,
            d = $.Deferred(),
            idFinder = function(obj) {
                if (obj.attribute) {
                    return obj.attribute.content.displayForms[0].meta.identifier;
                } else if (obj.dimension) {
                    return obj.dimension.content.attributes.content.displayForms[0].meta.identifier;
                } else if (obj.metric) {
                    return obj.metric.meta.identifier;
                }

                throw "Unknown object!";
            };

        if (!$.isPlainObject(uri)) {
            getObjectDetails(uri).then(function(data) { d.resolve(idFinder(data)); }, d.reject);
        } else {
            d.resolve(idFinder(obj));
        }

        return d.promise();
    };

    /**
     * Get uri of an metadata object, specified by its identifier and project id it belongs to
     *
     * @method getObjectUri
     * @param projectId id of the project
     * @param identifier identifier of the metadata object
     * @return {String} uri of the metadata object
     */
    var getObjectUri = function(projectId, identifier) {
        var d = $.Deferred(),
            uriFinder = function(obj) {
                var data = (obj.attribute) ? obj.attribute : obj.metric;
                return data.meta.uri;
            };

        xhr.ajax('/gdc/md/'+projectId+'/identifiers', {
            type: 'POST',
            headers: { Accept: 'application/json' },
            data: {
                "identifierToUri": [identifier]
            }
        }).then(function(data) {
            var found = data.identifiers.filter(function(i) {
                return i.identifier === identifier;
            });

            if(found[0]) {
                return getObjectDetails(found[0].uri);
            }

            d.reject('identifier not found');
        }, d.reject).then(function(objData) {
            if (!objData.attributeDisplayForm) {
                return d.resolve(uriFinder(objData));
            } else {
                return getObjectDetails(objData.attributeDisplayForm.content.formOf).then(function(objData) {
                            d.resolve(uriFinder(objData));
                        }, d.reject);
            }
        }, d.reject);

        return d.promise();
    };


    return {
        getAttributes: getAttributes,
        getDimensions: getDimensions,
        getFolders: getFolders,
        getFoldersWithItems: getFoldersWithItems,
        getMetrics: getMetrics,
        getAvailableMetrics: getAvailableMetrics,
        getAvailableAttributes: getAvailableAttributes,
        getObjectDetails: getObjectDetails,
        getObjectIdentifier: getObjectIdentifier,
        getObjectUri: getObjectUri
    };
});


// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('execution',['xhr'], function(xhr) {
    

    /**
     * Module for execution on experimental execution resource
     *
     * @class execution
     * @module execution
     */

    /**
     * For the given projectId it returns table structure with the given
     * elements in column headers.
     *
     * @method getData
     * @param {String} projectId - GD project identifier
     * @param {Array} elements - An array of attribute or metric identifiers.
     * @param {Object} executionConfiguration - Execution configuration - can contain for example
     *                 property "filters" containing execution context filters
     *                 property "where" containing query-like filters
     * @return {Object} Structure with `headers` and `rawData` keys filled with values from execution.
     */
    var getData = function(projectId, elements, executionConfiguration) {
        // Create request and result structures
        var request = {
            execution: {
                columns: elements
            }
        };

        // enrich configuration with supported properties such as
        // where clause with query-like filters or execution context filters
        executionConfiguration = executionConfiguration || {};
        ['filters', 'where'].forEach(function(property) {
            if (executionConfiguration[property]) {
                request.execution[property] = executionConfiguration[property];
            }
        });

        var executedReport = {
            isLoaded: false
        };
        // create empty promise-like Ember.Object
        var d = $.Deferred();

        // Execute request
        xhr.post('/gdc/internal/projects/'+projectId+'/experimental/executions', {
            data: JSON.stringify(request)
        }, d.reject).then(function(result) {
            // Populate result's header section
            executedReport.headers = result.executionResult.columns.map(function(col) {
                if (col.attributeDisplayForm) {
                    return {
                        type: 'attrLabel',
                        id: col.attributeDisplayForm.meta.identifier,
                        uri: col.attributeDisplayForm.meta.uri,
                        title: col.attributeDisplayForm.meta.title
                    };
                } else {
                    return {
                        type: 'metric',
                        id: col.metric.meta.identifier,
                        title: col.metric.meta.title,
                        format: col.metric.content.format
                    };
                }
            });
            // Start polling on url returned in the executionResult for tabularData
            return xhr.ajax(result.executionResult.tabularDataResult);
        }, d.reject).then(function(result) {
            // After the retrieving computed tabularData, resolve the promise
            executedReport.rawData = (result && result.tabularDataResult) ? result.tabularDataResult.values : [];
            executedReport.isLoaded = true;
            d.resolve(executedReport);
        }, d.reject);

        return d.promise();
    };

    return {
        getData: getData
    };
});


// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('project',['xhr', 'util'], function(xhr, util) {
    

    /**
     * Functions for working with projects
     *
     * @class project
     * @module project
     */


    /**
     * Get current project id
     *
     * @method getCurrentProjectId
     * @return {String} current project identifier
     */
    var getCurrentProjectId = function() {
        return xhr.get('/gdc/app/account/bootstrap').then(function(result) {
            var currentProject = result.bootstrapResource.current.project;
            // handle situation in which current project is missing (e.g. new user)
            if (!currentProject) {
                return null;
            }

            return result.bootstrapResource.current.project.links.self.split('/').pop();
        });
    };

   /**
     * Fetches projects available for the user represented by the given profileId
     *
     * @method getProjects
     * @param {String} profileId - User profile identifier
     * @return {Array} An Array of projects
     */
    var getProjects = function(profileId) {
        return xhr.get('/gdc/account/profile/' + profileId + '/projects').then(function(result) {
            return result.projects.map(function(p) { return p.project; });
        });
    };

    /**
     * Fetches all datasets for the given project
     *
     * @method getDatasets
     * @param {String} projectId - GD project identifier
     * @return {Array} An array of objects containing datasets metadata
     */
    var getDatasets = function(projectId) {
        return xhr.get('/gdc/md/' + projectId + '/query/datasets').then(util.getIn('query.entries'));
    };

    var DEFAULT_PALETTE = [
        {r:0x2b, g:0x6b, b:0xae},
        {r:0x69, g:0xaa, b:0x51},
        {r:0xee, g:0xb1, b:0x4c},
        {r:0xd5, g:0x3c, b:0x38},
        {r:0x89, g:0x4d, b:0x94},
        {r:0x73, g:0x73, b:0x73},
        {r:0x44, g:0xa9, b:0xbe},
        {r:0x96, g:0xbd, b:0x5f},
        {r:0xfd, g:0x93, b:0x69},
        {r:0xe1, g:0x5d, b:0x86},
        {r:0x7c, g:0x6f, b:0xad},
        {r:0xa5, g:0xa5, b:0xa5},
        {r:0x7a, g:0xa6, b:0xd5},
        {r:0x82, g:0xd0, b:0x8d},
        {r:0xff, g:0xd2, b:0x89},
        {r:0xf1, g:0x84, b:0x80},
        {r:0xbf, g:0x90, b:0xc6},
        {r:0xbf, g:0xbf, b:0xbf}
    ];

    /**
     * Fetches a chart color palette for a project represented by the given
     * projectId parameter.
     *
     * @method getColorPalette
     * @param {String} projectId - A project identifier
     * @return {Array} An array of objects with r, g, b fields representing a project's
     * color palette
     */
    var getColorPalette = function(projectId) {
        var d = $.Deferred();

        xhr.get('/gdc/projects/'+ projectId +'/styleSettings').then(function(result) {
            d.resolve(result.styleSettings.chartPalette.map(function(c) {
                return {
                    r: c.fill.r,
                    g: c.fill.g,
                    b: c.fill.b
                };
            }));
        }, function(err) {
            if (err.status === 200) {
                d.resolve(DEFAULT_PALETTE);
            }
            d.reject(err);
        });

        return d.promise();
    };

    /**
     * Sets given colors as a color palette for a given project.
     *
     * @method setColorPalette
     * @param {String} projectId - GD project identifier
     * @param {Array} colors - An array of colors that we want to use within the project.
     * Each color should be an object with r, g, b fields.
     */
    var setColorPalette = function(projectId, colors) {
        var d = $.Deferred();

        xhr.put('/gdc/projects/'+ projectId +'/styleSettings', {
            data:  {
                styleSettings: {
                    chartPalette: colors.map(function(c, idx) {
                        return {
                            guid: 'guid'+idx,
                            fill: c
                        };
                    })
                }
            }
        }).then(d.resolve, d.reject);

        return d.promise();
    };

    return {
        getCurrentProjectId: getCurrentProjectId,
        getProjects: getProjects,
        getDatasets: getDatasets,
        getColorPalette: getColorPalette,
        setColorPalette: setColorPalette,
        DEFAULT_PALETTE: DEFAULT_PALETTE
    };
});


// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
define('gooddata',[
    'xhr',
    'util',
    'user',
    'metadata',
    'execution',
    'project',
    'config'
], function(
    xhr,
    util,
    user,
    metadata,
    execution,
    project,
    config
) {
    

    /**
     * # JS SDK
     * Here is a set of functions that mostly are a thin wraper over the [GoodData API](https://developer.gooddata.com/api).
     * Before calling any of those functions, you need to authenticate with a valid GoodData
     * user credentials. After that, every subsequent call in the current session is authenticated.
     * You can find more about the GD authentication mechanism here.
     *
     * ## Conventions and Dependencies
     * * Depends on [jQuery JavaScript library](http://jquery.com/) javascript library
     * * Each SDK function returns [jQuery Deferred promise](http://api.jquery.com/deferred.promise/)
     *
     * ## GD Authentication Mechansim
     * In this JS SDK library we provide you with a simple `login(username, passwd)` function
     * that does the magic for you.
     * To fully understand the authentication mechansim, please read
     * [Authentication via API article](http://developer.gooddata.com/article/authentication-via-api)
     * on [GoodData Developer Portal](http://developer.gooddata.com/)
     *
     * @module sdk
     * @class sdk
     */
    return {
        config: config,
        xhr: xhr,
        user: user,
        md: metadata,
        execution: execution,
        project: project
    };
});


  // Ask loader to synchronously require the
  // module value for 'gooddata' here and return it as the
  // value to use for the public API for the built file.
  return require('gooddata');
}));
