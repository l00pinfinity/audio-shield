import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();

import audioRoutes from './routes/audioRoutes';

const app = express();

app.use(express.json());

app.use(cors())

app.use('/api/audio', audioRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
