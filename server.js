const http = require('http');
var fs = require('fs');
var express = require('express');
const { MongoClient } = require('mongodb');
var path = require('path');
const app = express();
const port = 8080;

async function fetchStock(res, selectType, symbol) {
    const uri = "mongodb+srv://jaxtsai:Mongo123@cluster0.3sm3y1e.mongodb.net/?appName=Cluster0";        
    const client = new MongoClient(uri);
    await client.connect();

    const database = client.db("Stock");
    const collection = database.collection("PublicCompanies");        
    const query = (selectType === 'company')? { Company: symbol } : { Ticker: symbol };

    console.log(query);
    const cursor = await collection.find(query);

    let tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dynamic Table</title>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Ticker</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
  `;
    // Print a message if no documents were found

    if ((await collection.countDocuments(query)) === 0) {
      console.log("Not found");
      tableHTML += `
      <tr>
        <td>${symbol}</td>
        <td>Not Found</td>
      </tr>`;

    }

    // Print returned documents

    for await (const doc of cursor) {

      console.log(doc);
      tableHTML += `
      <tr>
        <td>${doc.Company}</td>
        <td>${doc.Ticker}</td>
        <td>${doc.Price}</td>
      </tr>
`;
    }
    tableHTML += `
    </tbody>
    </table>
    </body>
    </html>
    `;

    res.end(tableHTML);
    await client.close();

    }

app.get('/process', (req, res) => {
  const selectType = req.query.selectType;
  const symbol = req.query.symbol;
  console.log('selectType:', selectType);
  console.log('symbol:', symbol);  
  fetchStock(res, selectType, symbol);

});
app.get('/', (req, res) => {
  const formData = req.body;
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.createReadStream(req.url.replace('/','')).pipe(res);
});

app.get('/home.html', (req, res) => {
  const formData = req.body;
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.createReadStream(req.url.replace('/','')).pipe(res);
});

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
