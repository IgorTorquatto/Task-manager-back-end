const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require("body-parser");
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
app.post("/create_user", (req, res) => {
    const { name, email, password } = req.body;
  
    // Verificar se os campos obrigatórios estão presentes
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }
  
    // Inserir o usuário no banco
    const query = `
      INSERT INTO users (name, email, password, created_at, updated_at) 
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    
    db.query(query, [name, email, password], (err, result) => {
      if (err) {
        console.error("Erro ao criar usuário:", err);
        return res.status(500).json({ error: "Erro ao criar usuário" });
      }
  
      res.status(201).json({
        message: "Usuário criado com sucesso",
        userId: result.insertId, // Retorna o ID do usuário inserido
      });
    });
});

app.listen(port,()=>{
    console.log(`Server running port ${port}`);
});