// const express = require('express');
// const cors = require('cors');
// const nodemailer = require('nodemailer');
// const mongoose = require('mongoose');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors({
//   origin: [
//     'https://portfolio-frontend-thm6.onrender.com',
//     'http://localhost:3000',
//   ],
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
// }));

// app.use(express.json());

// const contactSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     email: { type: String, required: true, trim: true },
//     subject: { type: String, required: true, trim: true },
//     message: { type: String, required: true, trim: true },
//   },
//   { timestamps: true }
// );

// const Contact = mongoose.model('Contact', contactSchema);

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 15000,
// });

// app.get('/health', (req, res) => {
//   res.status(200).json({ message: 'Backend is running' });
// });

// app.post('/send-email', async (req, res) => {
//   const { name, email, subject, message } = req.body;

//   if (!name || !email || !subject || !message) {
//     return res.status(400).json({
//       success: false,
//       message: 'All fields are required.',
//     });
//   }

//   try {
//     // Save contact data first
//     const contact = await Contact.create({ name, email, subject, message });

//     // Immediate response: frontend success popup shows now
//     res.status(201).json({
//       success: true,
//       message: 'Message received successfully!',
//       id: contact._id,
//     });

//     // Email sends in the background
//     transporter.sendMail({
//       from: `"Portfolio Website" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_USER,
//       replyTo: email,
//       subject: `New Portfolio Message: ${subject}`,
//       text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
//     })
//       .then(() => console.log('Email sent successfully'))
//       .catch((error) => console.error('Email error:', error));

//   } catch (error) {
//     console.error('Contact error:', error);

//     if (!res.headersSent) {
//       return res.status(500).json({
//         success: false,
//         message: 'Could not save your message.',
//       });
//     }
//   }
// });

// async function startServer() {
//   try {
//     await mongoose.connect(process.env.MONGO_URL, {
//       serverSelectionTimeoutMS: 15000,
//     });

//     console.log('MongoDB connected');

//     // Start server immediately. Do NOT use transporter.verify() here.
//     app.listen(PORT, '0.0.0.0', () => {
//       console.log(`Server running on port ${PORT}`);
//     });

//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// }

// startServer();







const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend((process.env.RESEND_API_KEY || '').trim());

app.use(cors({
  origin: [
    'https://portfolio-frontend-thm6.onrender.com',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Portfolio backend is running',
  });
});
app.post('/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.',
    });
  }

  try {
    const contact = await Contact.create({ name, email, subject, message });

    const { error } = await resend.emails.send({
      from: 'Portfolio Website <onboarding@resend.dev>',
      to: [process.env.RECEIVER_EMAIL],
      replyTo: email,
      subject: `New Portfolio Message: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error('Resend error:', error);

      return res.status(500).json({
        success: false,
        message:  error.message || 'Message saved, but email could not be sent.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      id: contact._id,
    });
  } catch (error) {
    console.error('Contact error:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not send your message.',
    });
  }
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

startServer();
