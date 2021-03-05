const express = require('express')
const exphbs = require('express-handlebars')
const bodyparser = require('body-parser')
const ObjectId = require('mongodb').ObjectID;
const multer = require('multer')
const mkdirp = require('mkdirp')

const app = express();
// create session 
const session = require('express-session')
app.use(session({
    saveUninitialized:true,
    resave:false,
    key: 'admin',
    secret: 'any random string'
}))

const mongoClient = require('mongodb').MongoClient;

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

mongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true },
    (error, client) => {
        const blog = client.db("blogDB")
        console.log('Connection Success!')

        app.engine('handlebars', exphbs());
        app.set('view engine', 'handlebars')

        app.use(express.static('public'))

        app.get('/login',(req,res)=>{
            res.render('login',{
                title:'login'
            })
        })
        
        app.post('/do-admin-login',(req,res)=>{
            res.redirect('/')
        })

        app.get('/', function(req, res) {
            blog.collection('posts').find().sort({ _id: -1 }).toArray(function(error, posts){
                res.render('home', {
                    title: "Blog",
                    posts: posts
                })
            })
        })

        app.get('/postdetails/:id', (req, res) => {

            blog.collection('posts').findOne({ "_id": ObjectId(req.params.id) },
                {
                    projection: { comments: { $slice: -5 } }
                }, (err, post) => {
                    if (err) {
                        return res.send(err)
                    }
                    //console.log(post.comments)
                    res.render('postDetails', {
                        title: post.title,
                        post: post
                    })
                })

        })

        app.get('/admin/dashboard', (req, res) => {
            res.render('dashboard', { title: 'Admin Dashboard' })
        })

        app.get('/admin/posts', (req, res) => {
            res.render('posts', { title: 'Posts' })
        })

        app.post('/do-post', (req, res) => {
            //console.log(req.body)
            blog.collection('posts').insertOne(req.body, (err, doc) => {
                if (!err) {
                    console.log('done!')
                }
            })
            res.redirect('/');
        })


        app.post('/do-comment', (req, res) => {
            blog.collection('posts').updateOne({ "_id": ObjectId(req.body.post_id) }, {
                $push: {
                    "comments": {
                        username: req.body.username,
                        comment: req.body.comment
                    }
                }
            }, (error, post) => {
                //console.log("Comment Added Successfully!");
            })
            const redirection = '/postdetails/' + req.body.post_id;
            res.redirect(redirection)
        })

        var upload = multer({
            storage: multer.diskStorage({
                destination: function (req, file, cb) {
                    var dest = 'public/uploads/';
                    mkdirp.sync(dest);
                    cb(null, dest);
                },
                filename: (req, file, cb) => {
                    cb(null, Date.now() + file.originalname)
                }
            }),
            fileFilter(req,file,cb){
                if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
                    return cb(new Error('please upload an image !'))
                }
                cb(null, true);
            }
        }).single('postImage');
 

        app.post('/upload', function(req, res){
            upload(req, res, (err) => {
                if(err){
                    res.send(err)
                }
                else{
                    var imageName ='';
                    if(req.file){
                        imageName = req.file.filename
                    } 
                    const postObject = {
                        image:imageName,
                        title:req.body.title,
                        content:req.body.content
                    }
                    blog.collection('posts').insertOne(postObject, (err, doc) => {
                        if (!err) {
                            console.log('done!')
                        }
                    })
                    res.redirect('/');
                }
           })
           //res.send('Success Uploading !!')
        })

        app.listen(3000, () => {
            console.log('app work on port 3000!')
        })
    })

