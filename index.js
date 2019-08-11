//backend frameword
const express = require('express');
const app = express();
//body parsing middleware
const bodyParser = require('body-parser');
//SQL querry builder
const knex = require('knex');
//creates hash with salt to be stored as password
const bcrypt = require('bcryptjs');
//for providing a Connect/Express middleware that can be used to enable CORS with various options
const cors = require('cors');

//app.use to modify things before an app.get runs AKA "middleware"
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//connects knex to postgres
const db = knex({
  client: 'pg',
  connection: {
    host : process.env.DATABASE_URL,
    ssl: true,
  }
});

//I am root
app.get('/', (req, res) => {
	res.json('I am root');
})

//for reloading favorites after changes
app.get('/favorites/:id', (req, res) => {
	db.select('favorites')
	.from('users')
	.where({name: req.params.id})
	.then(user => {
		res.json(user);
	})
	.catch(err => res.status(400).json('error getting favs'))
})

//adds to favorites
app.put('/favorites/', (req, res) => {
	console.log(req.body);
	db('users')
	.where('name', req.body.name)
	.update({
		favorites: db.raw(`array_append(favorites, '${req.body.putFavorites}')`)
	})
	.then(res.json(req.body.putFavorites));
})

//deletes from favorites
app.delete('/favorites/', (req, res) => {
	db('users')
	.where('name', req.body.name)
	.update({
		favorites: db.raw(`array_remove(favorites, '${req.body.deleteFavorites}')`)
	})
	.then(res.json(req.body.deleteFavorites));
})

//registers new user
app.post('/register', (req, res) => {
	if(req.body.password 
	&& req.body.email 
	&& req.body.name){
		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(req.body.password, salt, function(err, hash) {
				db('login')
				.returning('*')
				.insert({
					email: req.body.email,
					hash: hash,
				})
				.then(	
					db('users')
					.returning('*')
					.insert({
						name: req.body.name,
						email: req.body.email,
						joined: new Date(),
					})
					.then(user => {
						res.json(user[0]);
					}
				))
				.catch(err => res.status(400).json('unable to register'))	    	
		    });
		});		
	} else {
		res.json('please fill required fields');
	}
})

//signs you in
app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
       return res.status(400).json('incorrect form submission');
	}
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if (isValid) {
            return db.select('*').from('users')
                .where('email', '=', email)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials 1')
        } 
    })
    .catch(err => res.status(400).json('wrong credentrials 2'))
})

//enviormental variables
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`ExpressJsTest is listening on ${PORT}`)
});