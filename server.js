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

   // console.log("Conexão como banco de dados bem sucedida!");
});

//Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas Users
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

app.post('/login_user',(req,res)=>{
    const { email,password } = req.body;

    const query = `SELECT * FROM users WHERE email = ?`;
    db.query(query,[email], async (err,results)=>{
      if(err){
        return res.status(500).json({ message: "Erro no servidor"});
      }

      if(results.length === 0){
        return res.status(401).json({ message: "Usuário não encontrado"});
      }

      const user = results[0];
      //console.log(results); retorna uma lista de objetos todos os campos/colunas do banco de dados
      const isMatch = await bcrypt.compare(password,user.password);

      if(!isMatch){
        return res.status(401).json({ message: "Senha inválida" });
      }

      res.status(200).json({ message: "Login bem-sucedido", user: { id: user.id, name: user.name, email: user.email } });
    })
});

//Rotas tasks

//CREATE
app.post('/tasks', (req, res) => {
  const { user_id, title, description } = req.body;

  if (!user_id || !title || !description) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  const query = `INSERT INTO tasks (user_id, status, title, description, created_at, updated_at) VALUES (?,?,?,?,NOW(),NOW())`;
  db.query(query, [user_id,"pendente", title, description], (err, result) => {
    if (err) {
      console.error("Erro ao inserir tarefa:", err);
      return res.status(500).json({ message: "Erro interno no servidor." });
    }
    res.status(201).send({ id: result.insertId, title, description });
  });
});


//READ
app.get('/tasks/:userId',(req,res)=>{
  const {userId} = req.params;
  const query = `SELECT * FROM tasks WHERE user_id = ?`;
  db.query(query,[userId],(err,results)=>{
    if(err) return res.status(500).send(err);
    res.status(200).send({tasks: results});
  });
});

//UPDATE
app.put('/tasks/:id',(req,res)=>{
  const {id} = req.params;
  const {title,description} = req.body;
  const query = `UPDATE tasks SET title = ?, description = ? WHERE id = ?`;
  db.query(query,[title,description,id],(err)=>{
    if(err) return res.status(500).send(err);
    res.status(200).send({message: "Tarefa atualizada com sucesso!"});
  });
});

//DELETE
app.delete('/tasks/:id',(req,res)=>{
  const {id} = req.params;
  const query = `DELETE FROM tasks WHERE id = ?`;
  db.query(query,[id],(err)=>{
    if(err) return res.status(500).send(err);
    res.status(200).send({message: "Tarefa deletada com sucesso"});
  });
});

app.listen(port,()=>{
    console.log(`Server running port ${port}`);
});