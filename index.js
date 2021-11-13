const express = require('express')
var cors = require('cors')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()
const app = express()
app.use(cors())
app.use(express.json())

app.use(cors());
require('dotenv').config();

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uysgw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();

        const database = client.db('goBikes');
        const productCollection = database.collection('products');
        const usersCollection = database.collection('users');
        const odersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const size = parseInt(req.query.size);
            let products;

            if(size){
                products = await cursor.limit(size).toArray();
            }
            else{
                products = await cursor.toArray();
            }
            res.send(products);
        });
        
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.json(result)
        });
        app.post('/review', async (req, res) => {
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            res.json(result)
        });

        app.get('/reviews', async(req, res) => {
            const cursor = reviewsCollection.find({});
            const review = await cursor.toArray()
            res.json(review)
          });

        app.get('/product/:productId', async (req, res) => {
            const productId = req.params.productId;
            const query = { _id: ObjectId(productId) };
            const user = await productCollection.findOne(query);
            res.json(user)
        });



        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await odersCollection.insertOne(order);
            res.json(result);
        });

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            let cursor = '';
            if(email){
                const query = { email: email }
                cursor = odersCollection.find(query);
            }else{
                cursor = odersCollection.find({});
            }
            const orders = await cursor.toArray();
            res.json(orders);
        });

        app.put('/orders', async (req, res) => {
            const orderCan = req.query.can;
            const orderShip = req.query.ship;
            const id = req.query.id;
            if (orderShip) {                
                const filter = { _id: ObjectId(id) };
                const updateDoc = { $set: { shipped: 'Shipped' } };
                const result = await odersCollection.updateOne(filter, updateDoc);
                res.json(result);                
            }
            if (orderCan) {                
                const filter = { _id: ObjectId(id) };
                const updateDoc = { $set: { shipped: 'Canceled' } };
                const result = await odersCollection.updateOne(filter, updateDoc);
                res.json(result);                
            }

        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const requester = req.headers.authorization;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

    }
    finally{
        // await client.close();
    }
} 

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from Go bike!');
});

app.listen(port, () => {
  console.log(`listening at ${port}`)
});