const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const ddb = new AWS.DynamoDB({apiversion: "2.631.0"});

const table_name = "Jokes"; //name of the DynamoDB table

exports.rating = async (event) => {
    return await dbCalls(event);
}

async function dbCalls (event) {
    let averageRating = 0; //average rating
    let numRated = 1; //number of times joke was rated
    let payload = JSON.parse(event.body)

    var params_query = {
        ExpressionAttributeValues: {
            ":id": {
                S: payload.id.toString()
            }
        },
        KeyConditionExpression: "id = :id",
        TableName: table_name
    };

    const data = await ddb.query(params_query).promise();

    // if ID found in the table
    if (data.Items.length !== 0) {

        const params_write_new = {
            TableName: table_name,
            Key: {
                    'id': {
                        S: payload.id
                    }
            },
            UpdateExpression : "SET #attrName = list_append(#attrName, :attrValue)",
            ExpressionAttributeNames : {
                "#attrName" : "rating"
            },
            ExpressionAttributeValues : {
                ":attrValue" : {
                    L: [{
                        N: payload.rating.toString()
                    }]
                }
            },
            ReturnValues: "ALL_NEW",
        }

        await ddb.updateItem(params_write_new).promise();

        // calculate number of times joke was rated
        numRated = 1 + data.Items[0].rating.L.length;

        //calculate average rating
        for (i=0; i<data.Items[0].rating.L.length; i++){
            averageRating = (averageRating + parseInt(data.Items[0].rating.L[i].N,10))
        }

        averageRating = averageRating/numRated;
        averageRating = Math.round(averageRating * 10) / 10

    // if ID NOT found in the table
    } else {
        const params_write = {
            TableName: table_name,
            Item: {
                id: {
                    S: payload.id.toString()
                },
                rating: {
                    L: [{
                        N: payload.rating.toString()
                    }]
                }
            }
        }

        await ddb.putItem(params_write).promise();

        //calculate average rating
        averageRating = parseInt(payload.rating.toString(), 10);
    }

    var responseBody = {
        "id": payload.id.toString(),
        "rating": averageRating,
        "num_rated": numRated
    };

    var response = {
        "statusCode": 200,
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    };
    console.log("response: ", response);
    return response;

}
