const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//app.use to modify things before an app.get runs AKA "middleware"

//to send a static element such as webpage
//app.use(express.static(__dirname + '/public'));

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'Getnewjob8102',
    database : 'simple'
  }
});

app.get('/', (req, res) => {
	res.send('you get that root homie');
})

app.get('/profile/:id', (req, res) => {
	//knex makin it happin homie
	db.select('*')
	.from('users')
	.where({id: req.params.id})
	.then(user => {
		if (user.length) {
			res.json(user[0])
		} else {
			res.status(400).json('not found')
		}
	})
	.catch(err => res.status(400).json('error getting user'))
})

app.post('/register', (req, res) => {
	
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(req.body.password, salt, function(err, hash) {
		db('login')
		.returning('*')
		.insert({
			users: req.body.email,
			hash: hash,
		})
		//Do I need this?
		.then(	
			db('users')
			.returning('*')
			.insert({
				name: req.body.name,
				email: req.body.email,
				picture: req.body.picture,
				joined: new Date(),
			})
	.then(user => {
		res.json(user[0]);
	}))
		.catch(err => res.status(400).json('unable to register'))	    	
	    });
	});
})

app.post('/signin', (req, res) => {
	//yeah still trying to figure this one out
})

app.put('/addpass', (req, res) => {
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(req.body.password, salt, function(err, hash) {
			db('users')
			.where('email', '=', req.body.email)
			.update({
				password: hash,
			})
			.then(res.json('addpass success maybe'));
		})
	})
})

app.put('/status', (req, res) => {
	//knex cracka
	db('users')
	.where('name', '=', req.body.name)
	.update({
		status: req.body.status
	})
	.then(res.json('success maybe'));
})

app.put('/picture', (req, res) => {
	//knex cracka
	db('users')
	.where('name', '=', req.body.name)
	.update({
		picture: req.body.picture
	})
	.then(res.json('success maybe'));
})

//process.env.PORT???
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`server is listening on ${PORT}`)
});