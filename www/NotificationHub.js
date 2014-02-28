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

// http://msdn.microsoft.com/en-us/library/microsoft.windowsazure.messaging.notificationhub.notificationhub.aspx
var NotificationHub = function (notificationHubPath, connectionString) {
    if (typeof notificationHubPath == 'undefined') {
        throw new Error('Please specify notificationHubPath');
    }

    if (typeof connectionString == 'undefined') {
        throw new Error('Please specify connectionString');
    }
    this.notificationHubPath = notificationHubPath;
    this.connectionString = connectionString;

    this.onPushNotificationReceived = null;
};

// tags - optional
// http://msdn.microsoft.com/en-us/library/microsoft.windowsazure.messaging.notificationhub.registerasync.aspx
NotificationHub.prototype.registerApplicationAsync = function (tags) {
    var deferral = new Promise.Deferral(),

        successCallback = function (result) {
            deferral.resolve(result);
        },

        errorCallback = function (err) {
            deferral.reject(err);
        };
    
    var me = this,
        globalNotificationHandlerName = 'NotificationHub_onNotificationReceivedGlobal';
    // global handler that will be called every time new notification is received
    window[globalNotificationHandlerName] = function (msg) {
        // if handler attached
        if (me.onPushNotificationReceived != null) {
            me.onPushNotificationReceived(msg)
        }
    }

    exec(successCallback, errorCallback, 'NotificationHub', 'registerApplication', [this.notificationHubPath, this.connectionString, globalNotificationHandlerName, tags]);

    return deferral.promise;
}

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
