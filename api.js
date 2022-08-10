'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    const done = (err, res) => {
        if(err) console.error('ENDING REQUEST FAILED', err);
        callback(null, {
            statusCode: err? '400' : '200',
            body: err? '{"message": "' + err.message + '"}' :
                typeof res === 'string'? res : JSON.stringify(res),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
        });
    };

    event.queryStringParameters = event.queryStringParameters || {};
    let request;

    switch(event.httpMethod) {
        case 'GET':
            if(/\/?tiles/.test(event.path)) {
                dynamo.scan({
                    TableName: 'tile'
                }, (err, data) => {
                    if(!data || !data.Items) {
                        done(new Error('Cannot find tiles'));
                        return;
                    }
                    done(err, data.Items.sort((a, b) => a._id.localeCompare(b._id)));
                });
            } else {
                done(new Error('Unsupported action ' + event.httpMethod + ' ' + event.path));
            }
            break;
        case 'DELETE':
            if(/\/?tile/.test(event.path)) {
                dynamo.delete({
                    TableName: 'tile',
                    Key: {_id: event.queryStringParameters._id, state: 'Available'}
                }, done);
            } else {
                done(new Error('Unsupported action ' + event.httpMethod + ' ' + event.path));
            }
            break;
        case 'POST':
            request = JSON.parse(event.body);
            if(/\/?tiles/.test(event.path)) {
                dynamo.delete({
                    TableName: 'tile',
                    Key: {_id: request._id, state: 'Available'}
                }, (err, data) => {
                    if(err) {
                        done(new Error('Cannot delete such tile: ' + err));
                        return;
                    }
                    dynamo.put({
                        TableName: 'tile',
                        Item: {_id: request._id, state: request.state}
                    }, done);
                });
            } else {
                done(new Error('Unsupported action ' + event.httpMethod + ' ' + event.path));
            }
            break;
        default:
            done(new Error('Unsupported method ' + event.httpMethod));
            break;
    }
};
