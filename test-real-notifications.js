#!/usr/bin/env node

// Script para probar notificaciones con usuarios reales
const https = require('https');

const REAL_USERS = {
    TRUCK_DRIVER: {
        uid: 'aWLhp2eubLbtggP8sfhQV2EBpO32',
        name: 'Lucas',
        role: 'truck_driver'
    },
    CITIZEN: {
        uid: 'bT0KKtWfxpdgtFmTYcaF1M5RjHM2',
        name: 'eva corpus',
        role: 'citizen'
    }
};

async function sendRequest(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'notification-api-cjay.onrender.com',
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({ status: res.statusCode, body: result });
                } catch (e) {
                    resolve({ status: res.statusCode, body: responseData });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function testNotifications() {
    console.log('🚀 Testing FCM notifications with real users...\n');

    // Test 1: Notificación a Eva (ciudadana)
    console.log('📱 Test 1: Sending notification to Eva (citizen)');
    try {
        const evaNotification = {
            userId: REAL_USERS.CITIZEN.uid,
            message: '🎯 Test notification for Flutter cards - Should appear in NotificationsScreen'
        };

        const evaResult = await sendRequest('/api/test-fcm-direct', evaNotification);
        
        if (evaResult.status === 200 && evaResult.body.success) {
            console.log('✅ SUCCESS - Notification sent to Eva:');
            console.log(`   User: ${evaResult.body.user.name} (${evaResult.body.user.role})`);
            console.log(`   Message ID: ${evaResult.body.messageId}`);
            console.log('   📱 CHECK FLUTTER APP: Should appear as card in NotificationsScreen');
        } else {
            console.log('❌ FAILED - Eva notification:', evaResult.body);
        }
    } catch (error) {
        console.log('❌ ERROR - Eva notification:', error.message);
    }

    console.log('\n---\n');

    // Test 2: Notificación a Lucas (conductor)
    console.log('📱 Test 2: Sending notification to Lucas (truck driver)');
    try {
        const lucasNotification = {
            userId: REAL_USERS.TRUCK_DRIVER.uid,
            message: '🚛 Test notification for truck driver - Should appear in NotificationsScreen'
        };

        const lucasResult = await sendRequest('/api/test-fcm-direct', lucasNotification);
        
        if (lucasResult.status === 200 && lucasResult.body.success) {
            console.log('✅ SUCCESS - Notification sent to Lucas:');
            console.log(`   User: ${lucasResult.body.user.name} (${lucasResult.body.user.role})`);
            console.log(`   Message ID: ${lucasResult.body.messageId}`);
            console.log('   📱 CHECK FLUTTER APP: Should appear as card in NotificationsScreen');
        } else {
            console.log('❌ FAILED - Lucas notification:', lucasResult.body);
        }
    } catch (error) {
        console.log('❌ ERROR - Lucas notification:', error.message);
    }

    console.log('\n🏁 Test completed!');
    console.log('📱 Open your Flutter app and check the NotificationsScreen for the new cards.');
}

testNotifications();
