const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const ddb = new AWS.DynamoDB({apiversion: "2.631.0"});

const table_name = "Jokes"; //name of the DynamoDB table

exports.getRating = async (event) => {
    return await dbCalls(event);
}

async function dbCalls (event) {
    let averageRating = 0; //average rating
    let numRated = 0; //number of times joke was rated
    let id = null;
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
        console.log("found")
        // calculate number of times joke was rated
        numRated = 1 + data.Items[0].rating.L.length;

        //calculate average rating
        for (i=0; i<data.Items[0].rating.L.length; i++){
            averageRating = (averageRating + parseInt(data.Items[0].rating.L[i].N,10))
        }

        averageRating = averageRating/numRated;
        averageRating = Math.round(averageRating * 10) / 10
        id = data.Items[0].id.S;
    }

    var responseBody = {
        "id": id,
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
