/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements. See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership. The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

// Exposes Windows Azure Notification Hubs functionality (Apache Cordova Plugin).
// http://msdn.microsoft.com/en-us/library/microsoft.windowsazure.messaging.notificationhub.notificationhub.aspx
@interface NotificationHub : CDVPlugin

@property NSString *callbackId;
@property NSString *notificationHubPath;
@property NSString *connectionString;

// Asynchronously registers the device for native notifications.
- (void)registerApplication:(CDVInvokedUrlCommand*)command;
// Asynchronously unregisters the native registration on the application or secondary tiles.
- (void)unregisterApplication:(CDVInvokedUrlCommand*)command;

- (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSNotification *)notif;
- (void)didFailToRegisterForRemoteNotificationsWithError:(NSNotification *)notif;
- (void)didReceiveRemoteNotification:(NSNotification *)notif;

@end

