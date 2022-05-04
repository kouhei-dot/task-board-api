const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const tableName = process.env.TABLE_NAME;

exports.postItemHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
  }
  console.info('received:', JSON.stringify(event));

  const body = JSON.parse(JSON.stringify(event.body));
  const searchParam = {
    TableName: tableName,
    Key: { id: body.uid },
  };
  const getResult = await docClient.get(searchParam).promise();

  if (!getResult.Item) {
    console.info('item is not exist')
    const regData = {
      TableName: tableName,
      Item: {
        id: body.uid,
        todoList: [],
        wipList: [],
        doneList: [],
        createDate: new Date().toISOString(),
        updateDate: new Date().toISOString()
      },
    };
    await docClient.put(regData).promise();
  }

  const task = {
    taskId: body.taskId,
    name: body.name,
    detail: '',
    tags: [],
    createDate: new Date().toISOString(),
    updateDate: new Date().toISOString(),
  };
  const postParam = {
    TableName: tableName,
    Key: {
      id: body.uid
    },
    UpdateExpression: 'SET #key = list_append(#key, :value)',
    ExpressionAttributeNames: {
      '#key': 'todoList',
    },
    ExpressionAttributeValues: {
      ':value': [task],
    },
  };
  const result = await docClient.update(postParam).promise();

  const response = {
    statusCode: 200,
    body: JSON.stringify(result.$response),
  };

  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
};
