#!/usr/bin/env node
var LOG_NAME = process.env.LOG_NAME;

if (typeof LOG_NAME == 'undefined') {
    console.log('Must set LOG_NAME environment variable')
    process.exit(1)
}

var d = new Date();
var dateStringComponents = [
    d.getUTCFullYear(),
    ('0'+(d.getUTCMonth()+1)).slice(-2),
    ('0'+d.getUTCDate()).slice(-2),
    ('0'+d.getUTCHours()).slice(-2),
    ('0'+d.getUTCMinutes()).slice(-2),
    ('0'+d.getUTCSeconds()).slice(-2),
    ('00'+d.getUTCMilliseconds()).slice(-3),
    Math.random().toString(36).substring(7)
]
var STREAM_NAME = dateStringComponents.join('_')

var AWS = require('aws-sdk')
var cwl = new AWS.CloudWatchLogs({'region':'us-east-1'})
var sequenceToken

var logItems = []
var logTimer

function captureLogItem(data, source) {
    logItems.push({
        timestamp: new Date().getTime(),
        message: data
    })
    if (logItems.length > 999) {
        putLogItems()
    }
    if (JSON.stringify(logItems).length > 25000) {
        putLogItems()
    }
}

function putLogItems() {
    if (logItems.length == 0) {
        return
    }
    
    var itemsBeingPut = logItems
    logItems = []
    
    cwl.putLogEvents({
        logEvents: itemsBeingPut,
        logGroupName: LOG_NAME,
        logStreamName: STREAM_NAME,
        sequenceToken: sequenceToken
    }, function(err, data) {
        if (err) {
            console.log('Error putting log data:', err)
            logItems.push(itemsBeingPut)
        } else {
            sequenceToken = data.nextSequenceToken
        }
        
    })
}

cwl.createLogStream({
    logGroupName:LOG_NAME,
    logStreamName:STREAM_NAME
    },
    function (err,data) {
        if (err) {
            console.log('Unable to create log stream');
            console.log(err);
            process.exit(1);
        }
        
        logTimer = setInterval(putLogItems, 5000)

        process.stdin.setEncoding('utf8')
        
        process.stdin.on('readable', function() {
            var chunk = process.stdin.read()
            if (chunk != null) {
                captureLogItem(chunk.toString(), 'stdin')
            }
        })
        
        process.stdin.on('end', function() {
            clearInterval(logTimer)
            putLogItems()
        })
  
    });


