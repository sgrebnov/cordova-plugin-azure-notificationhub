/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var exec = require('cordova/exec');
var Promise = require('./Promise');

/**
 * Initializes a new instance of the NotificationHub class.
 * http://msdn.microsoft.com/en-us/library/microsoft.windowsazure.messaging.notificationhub.notificationhub.aspx
 *
 * @param {string} notificationHubPath The notification hub path (name).
 * @param {string} connectionString The connection string.
 * @param {string} options Platform specific additional parameters (optional).
 */
var NotificationHub = function (notificationHubPath, connectionString, options) {
    if (typeof notificationHubPath == 'undefined') {
        throw new Error('Please specify notificationHubPath');
    }

    if (typeof connectionString == 'undefined') {
        throw new Error('Please specify connectionString');
    }
    this.notificationHubPath = notificationHubPath;
    this.connectionString = connectionString;
    this.options = options;

    this.onPushNotificationReceived = null;
};

/**
 * Asynchronously registers the device for native notifications.
 * http://msdn.microsoft.com/en-us/library/dn339332.aspx
 *
 * @param {Array} tags The tags (not supported currently).
 */
NotificationHub.prototype.registerApplicationAsync = function (tags) {
    var me = this,
        globalNotificationHandlerName = 'NotificationHub_onNotificationReceivedGlobal';
    // global handler that will be called every time new notification is received
    window[globalNotificationHandlerName] = function (msg) {
        // if handler attached
        if (me.onPushNotificationReceived != null) {
            me.onPushNotificationReceived(msg)
        }
    };
    
    var deferral = new Promise.Deferral(),

    successCallback = function (result) {
    	// registration completeness callback
    	if (result && result.event == 'registerApplication') {
        	delete result.event; // not required
        	deferral.resolve(result);
        } else { //push notification
    		    window[globalNotificationHandlerName](result);
        }
    },

    errorCallback = function (err) {
        deferral.reject(err);
    };

    exec(successCallback, errorCallback, 'NotificationHub', 'registerApplication', [this.notificationHubPath, this.connectionString, globalNotificationHandlerName, tags, this.options]);

    return deferral.promise;
}

/**
 * Asynchronously unregisters the native registration on the application or secondary tiles.
 * http://msdn.microsoft.com/en-us/library/microsoft.windowsazure.messaging.notificationhub.unregisternativeasync.aspx
 */
NotificationHub.prototype.unregisterApplicationAsync = function ()
{
    var deferral = new Promise.Deferral(),

        successCallback = function (result) {
            deferral.resolve(result);
        },

        errorCallback = function (err) {
            deferral.reject(err);
        };

    exec(successCallback, errorCallback, 'NotificationHub', 'unregisterApplication', [this.notificationHubPath, this.connectionString]);

    return deferral.promise;
}

module.exports = NotificationHub;
