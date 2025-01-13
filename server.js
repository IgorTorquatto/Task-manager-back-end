const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();

const port = 3000;
const mysql_config = require('./mysql_config');

//connection database
const db = mysql.createConnection(mysql_config);
db.connect((error)=>{
    if(error){
        console.log("Conexão com o banco de dados mal sucedida!")
        return;
    }

    console.log("Conexão como banco de dados bem sucedida!");
});

//Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas
app.post("/create_user", async (req, res) => {
    const { name, email, password } = req.body;
  
    // Verificar se os campos obrigatórios estão presentes
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }
  
    try{
        //Gerar hash de senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password,saltRounds);

        // Query  SQL para inserir o usuário no banco
        const query = `
          INSERT INTO users (name, email, password, created_at, updated_at, deleted_at) 
          VALUES (?, ?, ?, NOW(), NOW(), NULL)
        `;
        
        db.query(query, [name, email, hashedPassword], (err, result) => {
          if (err) {
            console.error("Erro ao criar usuário:", err);
            return res.status(500).json({ error: "Erro ao criar usuário" });
          }
      
          res.status(201).json({
            message: "Usuário criado com sucesso",
            userId: result.insertId, // Retorna o ID do usuário inserido
          });
      });
    }catch(err){
        console.log("Erro ao criptografar senha", err);
        res.status(500).json({error: "Erro ao criar usuário"});
    }
});

app.listen(port,()=>{
    console.log(`Server running port ${port}`);
});