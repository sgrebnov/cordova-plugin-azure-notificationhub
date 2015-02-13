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

#import "NotificationHub.h"
#import <WindowsAzureMessaging/WindowsAzureMessaging.h>

@implementation NotificationHub {

}

- (void)pluginInitialize {
    // apply to our custom events since only AppDelegate can receive corresponding events
    // see iOS platform Quirks on plugin home page to get further instructions
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didRegisterForRemoteNotificationsWithDeviceToken:)
                                                 name:@"UIApplicationDidRegisterForRemoteNotifications" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didFailToRegisterForRemoteNotificationsWithError:)
                                                 name:@"UIApplicationDidFailToRegisterForRemoteNotifications" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveRemoteNotification:)
                                                 name:@"UIApplicationDidReceiveRemoteNotification" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didRegisterUserNotificationSettings:)
                                                 name:CDVRemoteNotification object:nil];
}

- (void)registerApplication:(CDVInvokedUrlCommand*)command
{
    self.notificationHubPath = [command.arguments objectAtIndex:0];
    self.connectionString = [command.arguments objectAtIndex:1];
    
    self.callbackId = command.callbackId;
    
    if (IsAtLeastiOSVersion(@"8.0")) {
        UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:(UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert) categories:nil];
        [[UIApplication sharedApplication] registerUserNotificationSettings:settings];
    } else {
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes: UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound];
    }
    
}

- (void)unregisterApplication:(CDVInvokedUrlCommand*)command
{
    self.callbackId = command.callbackId;
    
    NSString *notificationHubPath = [command.arguments objectAtIndex:0];
    NSString *connectionString = [command.arguments objectAtIndex:1];
    
    SBNotificationHub* hub = [[SBNotificationHub alloc] initWithConnectionString:connectionString notificationHubPath:notificationHubPath];
    
    [hub unregisterNativeWithCompletion:^(NSError* error) {
        if (error != nil) {
            [self failWithError:error];
            return;
        }
        [self reportResult:nil keepCallback:[NSNumber numberWithInteger: FALSE]];
    }];
    
}
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
    [[UIApplication sharedApplication] registerForRemoteNotifications];
}

- (void) didRegisterForRemoteNotificationsWithDeviceToken:(NSNotification *)notif
{
    if (self.connectionString == nil || self.notificationHubPath == nil) return;
    
    NSData *deviceToken  = notif.object;
    
    SBNotificationHub* hub = [[SBNotificationHub alloc] initWithConnectionString:
                              self.connectionString notificationHubPath:self.notificationHubPath];

    [hub registerNativeWithDeviceToken:deviceToken tags:nil completion:^(NSError* error) {
        if (error != nil) {
            [self failWithError:error];
            return;
        }
        
        // http://stackoverflow.com/a/1587441
        NSString *channelUri = [[deviceToken description] stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"<>"]];
        channelUri = [channelUri stringByReplacingOccurrencesOfString:@" " withString:@""];
        
        // create callback argument
        NSMutableDictionary* registration = [NSMutableDictionary dictionaryWithCapacity:4];
        [registration setObject:@"registerApplication" forKey:@"event"];
        [registration setObject:channelUri forKey:@"registrationId"]; // TODO: find the way to report registrationId
        [registration setObject:channelUri forKey:@"channelUri"];
        [registration setObject:self.notificationHubPath forKey:@"notificationHubPath"];
        
        [self reportResult: registration keepCallback:[NSNumber numberWithInteger: TRUE]];
    }];
}

- (void) didRegisterForRemoteNotificationsWithDeviceTokenCordova:(NSNotification *)notif
{
    if (self.connectionString == nil || self.notificationHubPath == nil) return;
    
    NSString *channelUri  = notif.object;
    NSData *deviceToken  = [channelUri dataUsingEncoding:NSUTF8StringEncoding];
    
    SBNotificationHub* hub = [[SBNotificationHub alloc] initWithConnectionString:
                              self.connectionString notificationHubPath:self.notificationHubPath];

    [hub registerNativeWithDeviceToken:deviceToken tags:nil completion:^(NSError* error) {
        if (error != nil) {
            [self failWithError:error];
            return;
        }
                
        // create callback argument
        NSMutableDictionary* registration = [NSMutableDictionary dictionaryWithCapacity:4];
        [registration setObject:@"registerApplication" forKey:@"event"];
        [registration setObject:channelUri forKey:@"registrationId"]; // TODO: find the way to report registrationId
        [registration setObject:channelUri forKey:@"channelUri"];
        [registration setObject:self.notificationHubPath forKey:@"notificationHubPath"];
        
        [self reportResult: registration keepCallback:[NSNumber numberWithInteger: TRUE]];
    }];
}

- (void)didFailToRegisterForRemoteNotificationsWithError:(NSNotification *)notif
{
    NSError* error = notif.object;
    [self failWithError:error];
}

- (void)didReceiveRemoteNotification:(NSNotification *)notif
{
    NSDictionary* userInfo = notif.object;
    NSDictionary* apsInfo = [userInfo objectForKey:@"aps"];
    
    [self reportResult: apsInfo keepCallback:[NSNumber numberWithInteger: TRUE]];
}

-(void)reportResult:(NSDictionary*)result keepCallback:(NSNumber*)keepCalback
{
    if (self.callbackId == nil) return;
    
    CDVPluginResult* pluginResult;
    if (result != nil)
    {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: result];
    } else
    {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    }
    pluginResult.keepCallback = keepCalback;
    
    [self success:pluginResult callbackId:self.callbackId];
}

-(void)failWithError:(NSError *)error
{
    if (self.callbackId == nil) return;
    
    NSString *errorMessage = [error localizedDescription];
    CDVPluginResult *commandResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errorMessage];
    
    [self.commandDelegate sendPluginResult:commandResult callbackId:self.callbackId];
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}


@end