var fs = require('fs');
var express = require('express');
const { MongoClient } = require('mongodb');
var path = require('path');
const app = express();

const port = process.env.PORT || 8080;
const apiKey = '&apikey=EG6KDTVRKHJECZUV';

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

    async function runGet(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Fetching data failed:", error);
        throw error;
      }
    }



    async function getQuote(symbol) {
      var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + symbol +apiKey;
      console.log("getQuote:" + symbol);

      const data = await runGet(url);
      console.log(data['Global Quote']['05. price']);
      return data['Global Quote']['05. price'];        
    }

    async function getTicker(selectType, symbol) {

        var url = 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=' + symbol + apiKey;
        console.log("getTicker:" + symbol);
        console.log(url);

        const data = await runGet(url);
        const array = data['bestMatches'];
        const ret =[];
        const key = (selectType === 'ticker') ? '1. symbol' : '2. name';
        for (let i =0; i < array.length; i++) {
          if (array[i][key] === symbol) {
            ret.push({ "ticker": array[i]['1. symbol'], "company":  array[i]['2. name'] })
          }
        }
        return ret;    
    }

    async function fetchStockWithAPI(res, selectType, symbol) {     
      const tt = await getTicker(selectType, symbol);

      console.log("tt:"+ tt);
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
    if (tt.length ==0) {
      const ticker= (selectType === 'ticker')?  symbol : null;
      const company = (selectType === 'company')? symbol:  null;
      console.log("Not found");
      tableHTML += `
      <tr>
        <td>${company}</td>
        <td>${ticker}</td>
        <td>Not Found</td>
      </tr>`;

    } else {
      // Print a message if no documents were found
      for (let i = 0; i < tt.length; i++) {
        const ticker= tt[i]['ticker'];
        const company = tt[i]['company'];
        let quote = await getQuote(tt[i]['ticker']);
        console.log("quote:" + quote);

        tableHTML += `
        <tr>
          <td>${company}</td>
          <td>${ticker}</td>
          <td>${quote}</td>
        </tr>`;
      }
    }
      // Print returned documents
  

      tableHTML += `
      </tbody>
      </table>
      </body>
      </html>
      `;
  
      res.end(tableHTML);
  
      }


app.get('/process', (req, res) => {
  const selectType = req.query.selectType;
  const symbol = req.query.symbol;
  console.log('selectType:', selectType);
  console.log('symbol:', symbol);  
  fetchStock(res, selectType, symbol);

});

app.get('/processAPI', (req, res) => {
  const selectType = req.query.selectType;
  const symbol = req.query.symbol;
  console.log('selectType:', selectType);
  console.log('symbol:', symbol);  
  fetchStockWithAPI(res, selectType, symbol);
});
app.get('/', (req, res) => {
  const formData = req.body;
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.createReadStream('home.html').pipe(res);
});

app.get('/home.html', (req, res) => {
  const formData = req.body;
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.createReadStream(req.url.replace('/','')).pipe(res);
});

app.listen(port, () => {
  console.log('Server listening on port ' + port);
});
