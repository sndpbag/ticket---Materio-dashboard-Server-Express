

const express = require('express');

const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

const db = require('./firestore');

const port = process.env.PORT || 8000;


// Get All Users
app.get("/users", async (req, res) => {
    try {
      const data = await db.collection("users").get();
      const users = data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


//    login api
app.post("/user-login", async (req,res)=>{
   
     try {
        const { email, password } = req.body;
    
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
    
        // Query Firestore for a user with the given email
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("email", "==", email).get();
    
        if (snapshot.empty) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
    
        let userData = null;
    
        snapshot.forEach((doc) => {
          const user = doc.data();
          if (user.password === password) {
            userData = { id: doc.id, name: user.name || user.Name, email: user.email, role: user.role || user.roll };
          }
        });
    
        if (!userData) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
    
        res.status(200).json({ message: "Login successful", user: userData });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
})



// Create Ticket (POST)
app.post('/tickets', async (req, res) => {

  console.log(req.body);
  try {
    const { title, description, priority, category, contactEmail, phone, date } = req.body;
    
    if (!title || !description || !contactEmail) {
      return res.status(400).json({ message: 'Title, Description, and Email are required' });
    }

    const ticketRef = db.collection('tickets').doc();
    await ticketRef.set({
      // id: ticketRef.id,
      title,
      description,
      priority,
      category,
      contactEmail,
      phone,
      date: date || new Date().toISOString(),
      // createdAt: admin.firestore.FieldValue.serverTimestamp(),
      
      
    });

    res.status(201).json({ message: 'Ticket created successfully', id: ticketRef.id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating ticket', error });
  }
});


//  user email wise show ticket
app.get('/tickets/:email',async(req,res)=>{
  try {
    const { email } = req.params;

    // Query Firestore to get tickets by email
    const ticketsRef = db.collection("tickets");
    const snapshot = await ticketsRef.where("contactEmail", "==", email).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No tickets found for this email" });
    }

    const tickets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

//  delete ticket

app.delete('/ticket-delete/:id',async (req,res)=>{
 try {
  const {id} = req.params;

  const ticketRef = db.collection('tickets').doc(id);
  const data = await ticketRef.get();

  if(!data.exists)
  {
    return res.status(404).json({message: 'Ticket Not Found'});
  }


  await ticketRef.delete(); // delete the doc



  res.status(200).json({message: 'Ticket successfully Delete'});


  
  console.log(id);
  
 } catch (error) {
  res.status(500).json({error: error.message});
 }
})


//  ticket show id wise
app.get('/ticket-show/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ticketRef = db.collection('tickets').doc(id);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    console.log("Fetched ticket:", doc.data());

    return res.json(doc.data()); // Return only the document data
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return res.status(500).json({ error: error.message });
  }
});


  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })