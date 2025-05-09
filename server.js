require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
db.connect(err => {
  if (err) throw err;
  console.log("Connected to DB");
});

// Handle checkout
app.post('/checkout', (req, res) => {
  const { product_name, customer_name, address, phone } = req.body;

  const query = 'INSERT INTO orders (product_name, customer_name, address, phone) VALUES (?, ?, ?, ?)';
  db.query(query, [product_name, customer_name, address, phone], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Gagal menyimpan pesanan.');
    }

    // Send WhatsApp via Ultramsg
    const waMsg = `Halo ${customer_name}, pesanan Anda untuk *${product_name}* telah kami terima. Terima kasih!`;
    try {
      await axios.get(`https://api.ultramsg.com/${process.env.WA_INSTANCE_ID}/messages/chat`, {
        params: {
          token: process.env.WA_TOKEN,
          to: `+62${phone}`,
          body: waMsg,
        }
      });
    } catch (err) {
      console.error("Gagal kirim WA:", err.response?.data || err.message);
    }

    res.send('Pesanan berhasil dikirim!');
  });
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server berjalan di http://localhost:${process.env.PORT}`);
});
