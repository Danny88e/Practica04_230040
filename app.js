import express from 'express';
import bodyParser from 'body-parser';
import {v4 as uuidv4} from 'uuid';
import session from 'express-session';
import moment from 'moment-timezone';
import os from 'os';

const app = express();
const sessions = {};

//middleware 
app.use(express.urlencoded({extended:true}))
app.use(express.json())

//Configura la sesion
//Configurar las sesiones
app.use(
    session({
        secret: "mi_secreto_seguro",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 60*60*1000 },
    })
);

//Funcion que nos permite acceder a la informacion de la interfaz de red en este caso LAN
const getclienteIp = (req) => {
    return(
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
    );
};


//Login endpoint
app.post("/login", (req,res)=>{ 
    console.log(req);
    const {email,nickname,macAddress}=req.body;
    if(!email || !nickname || !macAddress){
        return res.status(400).json({message:"Se esperan campos requeridos"})
    }
    const sessionID =uuidv4();
    const now = new Date();

    session[sessionID]={
        sessionID,
        email,
        nickname,
        macAddress,
        ip:getclienteIp(req),
        createdAt:now,
        lastAccessed:now

    }

    res.status(200).json({
        message:"Se ha logueado de manera exitosa",
        sessionID,
    });
});

//logout enpoint
app.post('/logout',(req,res)=> {
    const {sessionID}=req.body;
    if(!sessionID || !session[sessionID]){
        return res.status(404).json({message:"No se ha encontrado sesion acticva"})
    }
    delete session[sessionID];
    req.session.destroy((err)=>{
        if(err){
            return res.status(500).send('Error al cerrar la sesión');
        }
        })
    res.status(200).json({message:"Sesion cerrada exitosamente"}); 
})

//actualizar la sesion
app.put("/update",(req,res)=>{
    const{sessionID,email,nickname}=req.body;
    if(!sessionID || !session[sessionID]){
        return res.status(404).json({message:"no existe una sesión activa"})
    }

    if(email) sessions[sessionID].email=email;
    if(nickname) session[sessionID].nickname=nickname;
    session[sessionID].lastAccessed=new Date();
})

//Estatus
 app.get("/status", (req,res)=>{
    const sessionID = req.query.sessionID;
    
    if(!sessionID || ! session[sessionID]){
        return res.status(404).json({message:"No hay sesion activa"})
    }
    res.status(200).json({
        message:"sesion activa",
        session:session[sessionID]
    })
 })

app.get('/',(req,res)=>{
    return res.status(200).json({message:"Bienvenido a la api de control de sesiones", author:"Luis Daniel Suarez Escamilla"})
})

const PORT = 3000;
app.listen(PORT,()=>{
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`)
})