// Requerimos a express
const express = require('express');
// Requerimos a dotenv
const dotenv = require('dotenv');
// Requerimos el modulo bcryptjs
const bcryptjs = require('bcryptjs');
// Modulo para Var de Sesion
const session = require('express-session');


// Instancia de express
const app = express();


// Configuramos la direccion en nuestro proyecto (Variables de entorno)
dotenv.config({ path: 'env/.env' });


// Para invocar con resources todos los recursos en public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));


//  urlEncoded para capturar los daots del formularios
app.use(express.urlencoded({ extended:false }));
app.use(express.json());


// Establecer el motor de plantillas ejs
app.set('view engine', 'ejs');


app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));


// Requerimos el modulo de la conexion de la DB
const connection = require('./database/db');


// Ruta del proyecto
// Ruta principal del proyecto
app.get('/', (req, res) => {
  res.render('index');
});


app.get('/registro', (req, res) => {
  res.render('registro');
});


// Funcionalidad para el registro de los datos
app.post('/registro', async (req, res) => {
  // Obtenemos los datos del formularios de registro
  const email = req.body.email;
  const name = req.body.nombre;
  const rol = req.body.rol;
  const password = req.body.password;

  // Hashin de password encriptada
  let passwordHash = await bcryptjs.hash(password, 8);

  // Hacer una setencia SQL
  connection.query('INSERT INTO users SET ?', { email:email, name:name, rol:rol, password:passwordHash  }, async(error, results) => {
    if (error) {
      console.log(error);
    } else {
      // Si la consuta fue exitosa muestra alertas
      res.render('registro', {
        alert:true,
        alertTitle: 'Registro',
        alertMessage: 'Registro realizado correctamente!',
        alertIcon: 'success',
        showConfirmButton: false,
        timer:2000,
        ruta:''
      });
    }
  });
});


// Funcionalidad del login
app.post('/auth', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Hacer el hashing del password
  let passwordHash = await bcryptjs.hash(password, 8);

  // Controlar si el usuario existe
  if (email && password) {
    // Consulta a la base de datos
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))) {
        res.render('index', {
          alert:true,
          alertTitle: "Oops... Error!",
          alertMessage: "Usuario y/o Password incorrectos",
          alertIcon: "error",
          showConfirmButton: true,
          timer:false,
          ruta:''
        });
      } else {
        // Creamo una variable de session
        req.session.name = results[0].name
        req.session.loggedin = true;
        res.render('index', {
          alert:true,
          alertTitle: "Conexion Exitosa",
          alertMessage: "LOGIN CORRECTO!",
          alertIcon: "success",
          showConfirmButton:false,
          timer:2000,
          ruta:'home'
        });
      }
    })
  } else {
    res.render('index', {
      alert:true,
      alertTitle: 'Advertencia',
      alertMessage: "Por favor ingrese un usuario y/o contraseña",
      alertIcon: 'warning',
      showConfirmButton:true,
      timer:false,
      ruta:''
    });
  }


});


// Funcionalidad Auth para las otras paginas
app.get('/home', (req, res) => {
  if (req.session.loggedin) {
    res.render('principal', {
      login:true,
      name: req.session.name
    });
  } else {
    res.render('principal', {
      login:false,
      name: "Debe iniciar sesion"
    });
  }
});

// Funcionalidad para cerrar sesion del usuario
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});




// Puerto de escucha del server
app.listen(3000, ( req, res ) => {
  console.log('Servidor esta ejecutandose en http://localhost:3000');
});

