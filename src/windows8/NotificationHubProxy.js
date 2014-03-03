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
module.exports = {
    registerApplication: function (success, fail, args) {
        try {
            var notificationHubPath = args[0];
            var connectionString = args[1];
            var pushNotificationCallback = window[args[2]];
            var pushNotificationHandler = function (e) {
                var notification = null;
                try {
                    var notificationType = Windows.Networking.PushNotifications.PushNotificationType;
                    switch (e.notificationType) {
                        case notificationType.toast:
                            notification = e.toastNotification.content;
                            notification.notificationTypeName = "Toast";
                            break;
                        case notificationType.tile:
                            notification = e.tileNotification.content;
                            notification.notificationTypeName = "Tile";
                            break;
                        case notificationType.badge:
                            notification = e.badgeNotification.content;
                            notification.notificationTypeName = "Badge";
                            break;
                    }
                    pushNotificationCallback(notification);
                } catch (ex) {}
                e.cancel = true;
            }

            var notificationChannel = null;

            Windows.Networking.PushNotifications.PushNotificationChannelManager.createPushNotificationChannelForApplicationAsync().then(function (channel) {
                notificationChannel = channel;
                notificationChannel.addEventListener('pushnotificationreceived', pushNotificationHandler);
                return (new NotificationHubRuntimeProxy.HubApi()).registerNativeAsync(notificationHubPath, connectionString, channel.uri);
            }).done(function (result) {
                var regInfo = {};
                regInfo.registrationId = result;
                regInfo.channelUri = notificationChannel.uri;
                regInfo.notificationHubPath = notificationHubPath;

                success(regInfo);
            }, fail);

        } catch (ex) {
            fail(ex);
        }
    },

    unregisterApplication: function (success, fail, args) {
        try {
            var notificationHubPath = args[0];
            var connectionString = args[1];
          
            (new NotificationHubRuntimeProxy.HubApi()).unregisterNativeAsync(notificationHubPath, connectionString);

            success();

        } catch (ex) {
            fail(ex);
        }
    }

}

require("cordova/windows8/commandProxy").add("NotificationHub", module.exports);
