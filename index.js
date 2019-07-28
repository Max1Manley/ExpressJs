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
	db.select('name', 'email', 'picture', 'id', 'status')
	.from('users')
	.then(user => {
		res.json(user);
	})
})

/////////////////////////
/////////////////////////

app.get('/favorites/', (req, res) => {
	db.select('favorites')
	.from('users')
	.where({email: 'max1manley@gmail.com'})
	.then(user => {
		if (user.length) {
			res.json(user)
		} else {
			res.status(400).json('not found')
		}
	})
	.catch(err => res.status(400).json('error getting favs'))
})

/////////////////////////

app.put('/favorites/', (req, res) => {
	console.log(req.body);
	db('users')
	.where('name', req.body.name)
	.update({
		favorites: db.raw(`array_append(favorites, '${req.body.putFavorites}')`)
	})
	.then(res.json(req.body.putFavorites));
})

/////////////////////////

app.delete('/favorites/', (req, res) => {
	db('users')
	.where('name', req.body.name)
	.update({
		favorites: db.raw(`array_remove(favorites, '${req.body.deleteFavorites}')`)
	})
	.then(res.json(req.body.deleteFavorites));
})

/////////////////////////
/////////////////////////

app.get('/profile/:id', (req, res) => {
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
						picture: req.body.picture,
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

app.post('/signin', (req, res) => {
    const { email, password } =req.body;
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

app.put('/status', (req, res) => {
	db('users')
	.where('name', '=', req.body.name)
	.update({
		status: req.body.status
	})
	.then(res.json('success maybe'));
})

app.put('/picture', (req, res) => {
	db('users')
	.where('name', '=', req.body.name)
	.update({
		picture: req.body.picture
	})
	.then(res.json('success maybe'));
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`server is listening on ${PORT}`)
});